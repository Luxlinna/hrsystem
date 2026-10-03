import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthRepository, authRepository } from './auth.repository.js';
import { LoginDTO, ForgotPasswordDTO, ResetPasswordDTO, ChangePasswordDTO } from './dtos/auth.dto.js';
import { AppError, UnauthorizedError, NotFoundError } from '../../core/errors/app.error.js';
import { sendTelegramNotification } from '../../common/utils/telegram.util.js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jnrozihprpjvnofjlbtd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

export class AuthService {
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;

  constructor(private repo: AuthRepository = authRepository) {
    this.adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * Authenticate user with Email & Password
   */
  async login(dto: LoginDTO) {
    const { data, error } = await this.anonClient.auth.signInWithPassword({
      email: dto.email.trim(),
      password: dto.password,
    });

    if (error || !data?.user || !data?.session) {
      throw new UnauthorizedError(error?.message || 'Invalid email or password');
    }

    const employee = await this.repo.findEmployeeByEmail(dto.email);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: employee?.role || 'STAFF',
      },
      employee: employee
        ? {
            id: employee.id,
            employeeCode: employee.employee_code,
            firstName: employee.first_name,
            lastName: employee.last_name,
            role: employee.role,
            branchId: employee.branch_id,
            department: employee.department,
          }
        : null,
    };
  }

  /**
   * Request password reset link / ticket
   */
  async requestPasswordReset(dto: ForgotPasswordDTO) {
    const email = dto.email.toLowerCase().trim();
    const employee = await this.repo.findEmployeeByEmail(email);

    // Save request to database audit table
    const resetReq = await this.repo.createPasswordResetRequest({
      email,
      user_id: employee?.id,
      admin_note: 'Requested via REST API',
    });

    try {
      // Generate recovery link using Supabase Admin Auth
      const { data: linkData, error: linkError } = await this.adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      if (linkError) {
        console.warn('[Auth] Failed to generate recovery link for email:', email, linkError.message);
      }

      // Send alert to admin via Telegram
      const alertMsg = [
        '🔐 <b>Password Reset Requested</b>',
        '',
        `📧 <b>Email:</b> ${email}`,
        `👤 <b>Employee:</b> ${employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown / External'}`,
        `🕒 <b>Time:</b> ${new Date().toISOString()}`,
        `🆔 <b>Request ID:</b> <code>${resetReq.id}</code>`,
      ].join('\n');

      await sendTelegramNotification(alertMsg);

      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
        requestId: resetReq.id,
        actionLink: linkData?.properties?.action_link || undefined,
      };
    } catch (err: any) {
      console.error('[Auth] Error in password reset flow:', err?.message || err);
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
        requestId: resetReq.id,
      };
    }
  }

  /**
   * Reset user password using token / admin update
   */
  async resetPassword(dto: ResetPasswordDTO) {
    // If token is a request ID, update corresponding user
    const resetReq = await this.repo.findPendingResetRequest(dto.token);
    if (!resetReq) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const { error } = await this.adminClient.auth.admin.updateUserById(
      resetReq.user_id || resetReq.email,
      { password: dto.newPassword }
    );

    if (error) {
      throw new AppError(`Failed to update password: ${error.message}`, 400);
    }

    await this.repo.updateResetRequestStatus(resetReq.id, 'completed', 'Password updated successfully');

    return {
      success: true,
      message: 'Password has been reset successfully. You may now sign in with your new password.',
    };
  }

  /**
   * Change password for logged-in user
   */
  async changePassword(userId: string, dto: ChangePasswordDTO) {
    const { error } = await this.adminClient.auth.admin.updateUserById(userId, {
      password: dto.newPassword,
    });

    if (error) {
      throw new AppError(`Failed to change password: ${error.message}`, 400);
    }

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser(userId: string, email?: string) {
    const employee = email
      ? await this.repo.findEmployeeByEmail(email)
      : await this.repo.findEmployeeById(userId);

    if (!employee) {
      return {
        id: userId,
        email,
        role: 'STAFF',
        employee: null,
      };
    }

    return {
      id: userId,
      email: employee.email || email,
      role: employee.role || 'STAFF',
      employee: {
        id: employee.id,
        employeeCode: employee.employee_code,
        firstName: employee.first_name,
        lastName: employee.last_name,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        branchId: employee.branch_id,
        workLocationId: employee.default_work_location_id,
        role: employee.role,
        status: employee.status,
      },
    };
  }
}

export const authService = new AuthService();

import { supabaseAdminClient, supabaseAnonClient } from '../config/supabase.js';
import { AuthRepository, authRepository } from '../models/auth.repository.js';
import { LoginDTO, ForgotPasswordDTO, ResetPasswordDTO, ChangePasswordDTO } from '../validators/auth.validator.js';
import { AppError, UnauthorizedError, TooManyRequestsError } from '../utils/http-error.js';
import { sendTelegramNotification } from './telegram.service.js';
import { logger } from '../config/logger.js';

interface LoginLockoutRecord {
  failedAttempts: number;
  stage: number;
  lockoutUntil: number;
  lastFailedAt: number;
}

const loginLockoutStore = new Map<string, LoginLockoutRecord>();

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  /**
   * Authenticate user with Email & Password with escalating lockout:
   * - 5 consecutive failures -> 1 minute lockout
   * - 1 attempt allowed after 1 minute -> if failed, 5 minutes lockout (1x5)
   * - 1 attempt allowed after 5 minutes -> if failed, 25 minutes lockout (5x5)
   * - Successful login resets the lockout record
   */
  async login(dto: LoginDTO) {
    if (!supabaseAnonClient) {
      throw new AppError('Supabase client is not configured', 500);
    }

    const emailKey = dto.email.trim().toLowerCase();
    const now = Date.now();
    const existing = loginLockoutStore.get(emailKey);

    if (existing && existing.lockoutUntil > now) {
      const retryAfterSeconds = Math.ceil((existing.lockoutUntil - now) / 1000);
      const minutes = Math.ceil(retryAfterSeconds / 60);
      const timeStr = retryAfterSeconds > 60
        ? `${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''}`;
      throw new TooManyRequestsError(
        `Too many failed login attempts. Please wait ${timeStr} before trying again.`,
        { retryAfterSeconds, stage: existing.stage }
      );
    }

    const { data, error } = await supabaseAnonClient.auth.signInWithPassword({
      email: dto.email.trim(),
      password: dto.password,
    });

    if (error || !data?.user || !data?.session) {
      let rec = loginLockoutStore.get(emailKey) || {
        failedAttempts: 0,
        stage: 0,
        lockoutUntil: 0,
        lastFailedAt: 0,
      };

      rec.failedAttempts += 1;
      rec.lastFailedAt = now;

      if (rec.stage === 0) {
        if (rec.failedAttempts >= 5) {
          rec.stage = 1;
          rec.lockoutUntil = now + 60 * 1000;
          loginLockoutStore.set(emailKey, rec);
          throw new TooManyRequestsError(
            'Too many failed login attempts. Please wait 1 minute before trying again.',
            { retryAfterSeconds: 60, stage: 1 }
          );
        } else {
          const remaining = 5 - rec.failedAttempts;
          loginLockoutStore.set(emailKey, rec);
          throw new UnauthorizedError(
            `Invalid credentials. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before temporary lockout.`
          );
        }
      } else {
        let durationSec = 60;
        const nextStage = rec.stage + 1;
        if (rec.stage === 1) {
          // 1x5 = 5 minutes (300s)
          durationSec = 5 * 60;
        } else if (rec.stage === 2) {
          // 5x5 = 25 minutes (1500s)
          durationSec = 25 * 60;
        } else {
          durationSec = 25 * 60;
        }

        rec.stage = nextStage;
        rec.lockoutUntil = now + durationSec * 1000;
        loginLockoutStore.set(emailKey, rec);
        const minutes = Math.round(durationSec / 60);
        throw new TooManyRequestsError(
          `Too many failed login attempts. Please wait ${minutes} minutes before trying again.`,
          { retryAfterSeconds: durationSec, stage: rec.stage }
        );
      }
    }

    // Success -> Clear lockout
    loginLockoutStore.delete(emailKey);

    let employee = null;
    try {
      employee = await this.repo.findEmployeeByEmail(dto.email);
    } catch (dbErr: any) {
      logger.warn('[Auth] Employee database lookup failed during login:', dbErr?.message || dbErr);
    }

    let telegramOtpEnabled = true;
    try {
      if (supabaseAdminClient) {
        const { data: setting } = await supabaseAdminClient
          .from('system_settings')
          .select('value')
          .eq('key', 'telegram_otp_enabled')
          .maybeSingle();
        if (setting && setting.value === 'false') {
          telegramOtpEnabled = false;
        }
      }
    } catch (settingErr: any) {
      logger.warn('[Auth] Failed to check telegram_otp_enabled setting:', settingErr?.message || settingErr);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      telegramOtpEnabled,
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
      let actionLink: string | undefined;

      if (supabaseAdminClient) {
        // Generate recovery link using Supabase Admin Auth
        const { data: linkData, error: linkError } = await supabaseAdminClient.auth.admin.generateLink({
          type: 'recovery',
          email,
        });

        if (linkError) {
          logger.warn('[Auth] Failed to generate recovery link for email:', email, linkError.message);
        } else {
          actionLink = linkData?.properties?.action_link || undefined;
        }
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
        actionLink,
      };
    } catch (err: any) {
      logger.error('[Auth] Error in password reset flow:', err?.message || err);
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
    if (!supabaseAdminClient) {
      throw new AppError('Supabase admin client is not configured', 500);
    }

    // If token is a request ID, update corresponding user
    const resetReq = await this.repo.findPendingResetRequest(dto.token);
    if (!resetReq) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const { error } = await supabaseAdminClient.auth.admin.updateUserById(
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
    if (!supabaseAdminClient) {
      throw new AppError('Supabase admin client is not configured', 500);
    }

    const { error } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
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

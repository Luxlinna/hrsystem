import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendTestEmail, sendUserInviteEmail } from '../services/smtp.service.js';

const settingsRouter = Router();

/**
 * POST /api/settings/smtp/test
 * Sends a test email using the SMTP config stored in system_settings.
 */
settingsRouter.post('/smtp/test', authenticate, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const recipient = req.body?.to || req.body?.email || req.user?.email;
    if (!recipient) {
      return res.status(400).json({ message: 'Could not determine recipient email address. Please ensure your user has an email or provide one in the request.' });
    }

    await sendTestEmail(recipient);
    return res.json({ ok: true, message: `Test email sent successfully to ${recipient}` });
  } catch (err: any) {
    console.error('[SMTP Test]', err?.message);
    return res.status(500).json({ message: err?.message || 'Failed to send test email.' });
  }
});

/**
 * POST /api/settings/smtp/send-invite
 * Sends a user invitation email with setup link using the configured SMTP.
 */
settingsRouter.post('/smtp/send-invite', authenticate, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, name, invite_link } = req.body;
    if (!email || !invite_link) {
      return res.status(400).json({ message: 'Email and invite_link are required.' });
    }

    await sendUserInviteEmail(email, name || email.split('@')[0], invite_link);
    return res.json({ ok: true, message: `Invitation email sent successfully to ${email}` });
  } catch (err: any) {
    console.error('[SMTP Invite]', err?.message);
    return res.status(500).json({ message: err?.message || 'Failed to send invitation email.' });
  }
});

export const settingsRoutes = settingsRouter;

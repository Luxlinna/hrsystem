import { supabase } from './supabase';

let isPushServiceAvailable: boolean | null = null;

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  link?: string;
  broadcast?: boolean;
}

/**
 * Safely invokes the send-push-notification Supabase Edge Function.
 * If the function returns 501 (missing FIREBASE_SERVICE_ACCOUNT_JSON in Supabase),
 * it flags availability as false and suppresses repeated failed network calls.
 */
export async function sendPushNotificationSafe(payload: PushPayload): Promise<boolean> {
  // If we already detected the edge function is not configured (501), skip
  if (isPushServiceAvailable === false) {
    return false;
  }

  try {
    const { error, data } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      // 501 Not Implemented: Firebase service account is not yet configured in Supabase
      if (error.status === 501 || error.message?.includes('501') || error.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
        isPushServiceAvailable = false;
        return false;
      }
      return false;
    }

    isPushServiceAvailable = true;
    return true;
  } catch (_err) {
    return false;
  }
}

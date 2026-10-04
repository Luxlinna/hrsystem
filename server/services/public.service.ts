import { PublicContactInput } from '../validators/public.validator.js';

export class PublicService {
  async handleContactMessage(data: PublicContactInput) {
    return {
      received: true,
      timestamp: new Date().toISOString(),
      sender: data.email,
    };
  }

  async getPublicSystemInfo() {
    return {
      system: 'HRSystem Enterprise',
      version: '1.0.0',
      status: 'operational',
    };
  }
}

export const publicService = new PublicService();

import { z } from 'zod';

export const publicContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export type PublicContactInput = z.infer<typeof publicContactSchema>;

import { z } from 'zod';

export const CheckInSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(255).optional(),
});

export type CheckInDTO = z.infer<typeof CheckInSchema>;

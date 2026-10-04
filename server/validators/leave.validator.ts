import { z } from 'zod';

export const CreateLeaveSchema = z.object({
  leaveTypeId: z.string().uuid('Invalid leave type ID'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date format' }),
  days: z.number().positive('Days must be greater than 0'),
  reason: z.string().max(500).optional(),
});

export type CreateLeaveDTO = z.infer<typeof CreateLeaveSchema>;

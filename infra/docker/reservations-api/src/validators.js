import { z } from 'zod';

export const locationValues = ['village', 'downtown', 'los-corales'];

const reservationSchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(120),
  location: z.enum(locationValues),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reservation_time: z.string().regex(/^\d{2}:\d{2}$/),
  guests: z.coerce.number().int().min(1).max(30),
  comments: z.string().trim().max(1000).optional().default(''),
  source: z.string().trim().max(32).optional().default('website'),
});

export function validateReservationPayload(payload) {
  const parsed = reservationSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Datos de reserva invalidos.',
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

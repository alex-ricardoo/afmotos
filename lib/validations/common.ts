import { z } from 'zod';

export const phoneSchema = z.string().regex(/^\d{10,11}$/, 'Invalid phone number');
export const emailSchema = z.string().email('Invalid email address').optional();

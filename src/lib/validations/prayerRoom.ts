import { z } from 'zod';

export const createPrayerRoomSchema = z.object({
  name: z.string().min(3, 'Prayer name must be at least 3 characters').max(80, 'Prayer name cannot exceed 80 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(400, 'Description cannot exceed 400 characters').optional(),
  logoUrl: z
    .string()
    .url('Logo must be a valid http or https image URL')
    .optional()
    .or(z.literal('')),
  roomType: z.enum(['AUDIO_PRAYER', 'PRAYER_LEADER_VIDEO', 'EVENT', 'LEADER_VIDEO']).default('AUDIO_PRAYER'),
  expectedAttendance: z.number().min(1, 'Expected attendance must be at least 1').max(50000, 'Maximum 50,000 for single room'),
  scheduledStart: z.string().min(1, 'Please select a gathering start time'),
  timezone: z.string().min(1, 'Timezone is required'),
  isRecurring: z.boolean().default(true),
  recurrenceRule: z.string().optional(),
  isPermanentLinkEnabled: z.boolean().default(true),
  speakerPermission: z
    .enum(['ADMIN_APPROVAL_REQUIRED', 'PRAYER_LEADERS', 'PRAYER_LEADERS_ONLY', 'OPEN_MICROPHONE'])
    .optional(),
  speakerPermissionMode: z
    .enum(['ADMIN_APPROVAL_REQUIRED', 'PRAYER_LEADERS_ONLY', 'OPEN_MICROPHONE'])
    .optional(),
  recordingEnabled: z.boolean().default(false),
});

export type CreatePrayerRoomInput = z.infer<typeof createPrayerRoomSchema>;

export const prayerRequestSchema = z.object({
  request: z.string().min(5, 'Prayer request must be at least 5 characters').max(600, 'Prayer request cannot exceed 600 characters'),
  isPrivate: z.boolean().default(false),
  participantName: z.string().min(2, 'Name is required').max(50, 'Name cannot exceed 50 characters'),
});

export type PrayerRequestInput = z.infer<typeof prayerRequestSchema>;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const onboardingSchema = z.object({
  churchName: z.string().min(3, 'Church name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  country: z.string().min(2, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  primaryContactName: z.string().min(2, 'Contact name is required'),
  primaryContactEmail: z.string().email('Valid contact email is required'),
  phone: z.string().optional(),
});

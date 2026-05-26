import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Team name is required',
    })
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name cannot exceed 50 characters')
    .trim(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  }),
});

export const updateTeamSchema = z.object({
  body: z.object({
    name: z.string()
    .min(3, 'Team name must be at least 3 characters')
    .max(50, 'Team name cannot exceed 50 characters')
    .trim()
    .optional(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email address is required',
    })
    .email('Please provide a valid email address')
    .trim(),
    role: z.enum(['admin', 'member'], {
      errorMap: () => ({ message: 'Role must be admin or member' }),
    }).default('member'),
  }),
});

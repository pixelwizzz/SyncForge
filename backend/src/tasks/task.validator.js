import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    team_id: z.string({
      required_error: 'Team ID is required',
    }).uuid('Invalid Team ID format'),
    title: z.string({
      required_error: 'Task title is required',
    })
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title cannot exceed 100 characters')
    .trim(),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    due_date: z.string().datetime({ message: 'Due date must be a valid ISO datetime' }).optional().nullable(),
    assignee_id: z.string().uuid('Invalid Assignee ID format').optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string()
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title cannot exceed 100 characters')
    .trim()
    .optional(),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_date: z.string().datetime({ message: 'Due date must be a valid ISO datetime' }).optional().nullable(),
    assignee_id: z.string().uuid('Invalid Assignee ID format').optional().nullable(),
  }),
});

export const queryTasksSchema = z.object({
  query: z.object({
    team_id: z.string().uuid('Invalid Team ID format').optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignee_id: z.string().uuid('Invalid Assignee ID format').optional(),
    page: z.string().transform((val) => parseInt(val, 10) || 1).optional().default('1'),
    limit: z.string().transform((val) => parseInt(val, 10) || 10).optional().default('10'),
  }),
});

// Shared Zod validation schemas for StudentLife AI
import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(255),
  major: z.string().max(100).optional(),
  year: z.number().int().min(1).max(4).optional(),
  interests: z.array(z.string()).optional(),
  profile_image_url: z.string().url().optional(),
});

export const EventSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  event_type: z.enum(['workshop', 'social', 'academic', 'sports']).optional(),
  location: z.string().max(255).optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  max_attendees: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
});

export const ResourceSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  resource_type: z.enum(['notes', 'slides', 'project', 'guide']).optional(),
  file_url: z.string().url(),
  file_size: z.number().int().positive().optional(),
});

export const ExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['food', 'transport', 'books', 'entertainment', 'housing']).optional(),
  description: z.string().optional(),
  transaction_date: z.string().datetime(),
  payment_method: z.string().max(50).optional(),
});

export const StudySessionSchema = z.object({
  course_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  duration_minutes: z.number().int().positive().optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

export const AssignmentSchema = z.object({
  course_id: z.string().uuid().optional(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  due_date: z.string().datetime(),
  estimated_hours: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

export const BudgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  category: z.string().max(50),
  planned_amount: z.number().positive(),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.any().optional(),
});

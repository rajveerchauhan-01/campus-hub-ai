const { z } = require('zod');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.email().transform(v => v.toLowerCase()),
  password: z.string().min(10).max(72),
  department: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional()
});
const loginSchema = z.object({ email: z.email().transform(v => v.toLowerCase()), password: z.string().min(1) });
const noteSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().default(''),
  subject: z.string().trim().min(2).max(100),
  branch: z.string().trim().max(100).optional().default('General'),
  semester: z.coerce.number().int().min(1).max(12),
  tags: z.union([z.array(z.string()), z.string()]).optional().default([]),
  visibility: z.enum(['public', 'private']).optional().default('public'),
  type: z.enum(['notes', 'syllabus', 'assignment', 'question-paper', 'lab-manual', 'other']).optional().default('notes')
});
module.exports = { objectId, registerSchema, loginSchema, noteSchema };

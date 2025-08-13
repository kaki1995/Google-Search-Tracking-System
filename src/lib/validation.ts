import { z } from 'zod';

export const StartSessionSchema = z.object({
  participant_id: z.string().uuid()
});

export const StartQuerySchema = z.object({
  session_id: z.string().uuid(),
  query_text: z.string().min(1),
  query_order: z.number().int().positive().optional(),
  query_structure: z.enum(['keyword', 'question', 'comparative']).optional()
});

export const EndQuerySchema = z.object({
  query_id: z.string().uuid()
});

export const LogClickSchema = z.object({
  query_id: z.string().uuid(),
  clicked_url: z.string().url(),
  clicked_rank: z.number().int().positive().optional()
});

export const LogScrollSchema = z.object({
  session_id: z.string().uuid(),
  path: z.string(),
  max_scroll_pct: z.number().min(0).max(100)
});

export const EndSessionSchema = z.object({
  session_id: z.string().uuid()
});

export type StartSessionRequest = z.infer<typeof StartSessionSchema>;
export type StartQueryRequest = z.infer<typeof StartQuerySchema>;
export type EndQueryRequest = z.infer<typeof EndQuerySchema>;
export type LogClickRequest = z.infer<typeof LogClickSchema>;
export type LogScrollRequest = z.infer<typeof LogScrollSchema>;
export type EndSessionRequest = z.infer<typeof EndSessionSchema>;
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const sessionSchema = z.object({
  topic_id: z.string().uuid(),
  session_date: z.string().min(1),
  duration_minutes: z.number().int().min(0).max(1440),
  summary: z.string().max(2000).optional().default(''),
  confidence_before: z.number().int().min(1).max(5).optional().default(1),
  confidence_after: z.number().int().min(1).max(5).optional().default(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    let query = supabaseServer
      .from('study_sessions')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('session_date', { ascending: false })
      .limit(limit);
    if (topicId) query = query.eq('topic_id', topicId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sessions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('study_sessions')
      .insert(parsed.data)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

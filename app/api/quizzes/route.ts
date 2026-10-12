import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const quizSchema = z.object({
  topic_id: z.string().uuid(),
  score: z.number().int().min(0),
  total_questions: z.number().int().min(1),
  quiz_date: z.string().min(1),
  notes: z.string().max(2000).optional().default(''),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');

    let query = supabaseServer
      .from('quiz_scores')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('quiz_date', { ascending: false });
    if (topicId) query = query.eq('topic_id', topicId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch quiz scores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('quiz_scores')
      .insert(parsed.data)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create quiz score';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

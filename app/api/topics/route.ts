import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const topicSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['NotStarted', 'Learning', 'Reviewing', 'Mastered']).optional().default('NotStarted'),
  confidence_level: z.number().int().min(1).max(5).optional().default(1),
  next_review_date: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('course_id');

    let query = supabaseServer.from('topics').select('*');
    if (courseId) query = query.eq('course_id', courseId);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = topicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('topics')
      .insert(parsed.data)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

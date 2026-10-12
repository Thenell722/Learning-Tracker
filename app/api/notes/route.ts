import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const noteSchema = z.object({
  topic_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(200),
  content: z.string().max(10000).optional().default(''),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topic_id');
    const search = searchParams.get('search');

    let query = supabaseServer
      .from('notes')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('created_at', { ascending: false });

    if (topicId) query = query.eq('topic_id', topicId);
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('notes')
      .insert(parsed.data)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

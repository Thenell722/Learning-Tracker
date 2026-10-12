import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const updateSchema = z.object({
  topic_id: z.string().uuid().optional(),
  session_date: z.string().min(1).optional(),
  duration_minutes: z.number().int().min(0).max(1440).optional(),
  summary: z.string().max(2000).optional(),
  confidence_before: z.number().int().min(1).max(5).optional(),
  confidence_after: z.number().int().min(1).max(5).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('study_sessions')
      .update(parsed.data)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseServer
      .from('study_sessions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

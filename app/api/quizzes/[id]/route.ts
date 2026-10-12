import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const updateSchema = z.object({
  score: z.number().int().min(0).optional(),
  total_questions: z.number().int().min(1).optional(),
  quiz_date: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
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
      .from('quiz_scores')
      .update(parsed.data)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update quiz score';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseServer
      .from('quiz_scores')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete quiz score';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

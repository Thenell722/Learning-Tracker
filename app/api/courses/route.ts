import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { getDefaultUser } from '@/lib/supabase/user';

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  color: z.string().min(1).max(50),
  icon: z.string().min(1).max(100),
  status: z.enum(['Active', 'Paused', 'Completed']).optional().default('Active'),
  target_hours: z.number().int().min(0).max(10000).optional().default(0),
});

export async function GET() {
  try {
    const user = await getDefaultUser();
    const { data, error } = await supabaseServer
      .from('courses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch courses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getDefaultUser();
    const { data, error } = await supabaseServer
      .from('courses')
      .insert({ ...parsed.data, user_id: user.id })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create course';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { suggestReviewDate } from '@/lib/spaced-repetition';

/**
 * GET /api/reviews
 * Query params: filter=due|overdue|upcoming (default: due)
 * Returns topics with next_review_date matching the filter.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') ?? 'due';
    const today = new Date().toISOString().slice(0, 10);

    let query = supabaseServer
      .from('topics')
      .select('*, course:courses(id, title, color, icon)')
      .not('next_review_date', 'is', null)
      .order('next_review_date', { ascending: true });

    if (filter === 'due') {
      query = query.lte('next_review_date', today);
    } else if (filter === 'overdue') {
      query = query.lt('next_review_date', today);
    } else if (filter === 'upcoming') {
      query = query.gt('next_review_date', today);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const completeSchema = z.object({
  topic_id: z.string().uuid(),
  confidence_level: z.number().int().min(1).max(5),
  auto_schedule: z.boolean().optional().default(true),
});

/**
 * POST /api/reviews/complete
 * Marks a review as complete by updating the topic's confidence level
 * and auto-suggesting the next review date using spaced repetition.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { topic_id, confidence_level, auto_schedule } = parsed.data;
    const nextReviewDate = auto_schedule
      ? suggestReviewDate(confidence_level).toISOString().slice(0, 10)
      : null;

    const updateData: Record<string, unknown> = {
      confidence_level,
      status: confidence_level >= 4 ? 'Reviewing' : 'Learning',
    };
    if (auto_schedule) {
      updateData.next_review_date = nextReviewDate;
    }

    const { data, error } = await supabaseServer
      .from('topics')
      .update(updateData)
      .eq('id', topic_id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

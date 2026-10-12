import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getDefaultUser } from '@/lib/supabase/user';
import { calculateStreaks } from '@/lib/streaks';
import { startOfWeek, endOfWeek, format, subDays, parseISO } from 'date-fns';

export async function GET() {
  try {
    const user = await getDefaultUser();

    // Fetch courses
    const { data: courses } = await supabaseServer
      .from('courses')
      .select('*')
      .eq('user_id', user.id);
    const courseIds = (courses ?? []).map((c) => c.id);

    // Fetch topics
    const { data: topics } = await supabaseServer
      .from('topics')
      .select('*')
      .in('course_id', courseIds);

    // Fetch this week's sessions
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const { data: weekSessions } = await supabaseServer
      .from('study_sessions')
      .select('*')
      .gte('session_date', weekStart)
      .lte('session_date', weekEnd);

    // Fetch all sessions for streak + recent
    const { data: allSessions } = await supabaseServer
      .from('study_sessions')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('session_date', { ascending: false })
      .limit(10);

    // Fetch quiz scores
    const topicIds = (topics ?? []).map((t) => t.id);
    const { data: quizzes } = await supabaseServer
      .from('quiz_scores')
      .select('*')
      .in('topic_id', topicIds);

    // Calculate stats
    const weekMinutes = (weekSessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0);

    const allSessionDates = (allSessions ?? []).map((s) => s.session_date);
    const { current: currentStreak, longest: longestStreak } = calculateStreaks(allSessionDates);

    const quizList = quizzes ?? [];
    const topicList = topics ?? [];
    const avgQuizScore = quizList.length > 0
      ? Math.round(
          (quizList.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0) /
            quizList.length) *
            10
        ) / 10
      : 0;

    const avgConfidence = topicList.length > 0
      ? Math.round((topicList.reduce((sum, t) => sum + t.confidence_level, 0) / topicList.length) * 10) /
        10
      : 0;

    // Reviews due today
    const today = format(new Date(), 'yyyy-MM-dd');
    const reviewsDueToday = topicList.filter(
      (t) => t.next_review_date && t.next_review_date <= today
    );

    // Low confidence topics (1-2)
    const lowConfidenceTopics = topicList
      .filter((t) => t.confidence_level <= 2)
      .sort((a, b) => a.confidence_level - b.confidence_level)
      .slice(0, 5);

    // Weekly chart data (last 7 days)
    const weeklyData = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayMinutes = (allSessions ?? [])
        .filter((s) => s.session_date === dateStr)
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        date: format(date, 'EEE'),
        minutes: dayMinutes,
        hours: Math.round((dayMinutes / 60) * 10) / 10,
      };
    });

    return NextResponse.json({
      userName: user.name,
      totalCourses: courses?.length ?? 0,
      totalTopics: topics?.length ?? 0,
      activeCourses: courses?.filter((c) => c.status === 'Active').length ?? 0,
      weekMinutes,
      avgQuizScore,
      avgConfidence,
      currentStreak,
      longestStreak,
      reviewsDueToday,
      lowConfidenceTopics,
      recentSessions: allSessions ?? [],
      weeklyData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

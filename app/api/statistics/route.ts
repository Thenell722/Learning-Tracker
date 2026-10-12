import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getDefaultUser } from '@/lib/supabase/user';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

export async function GET() {
  try {
    const user = await getDefaultUser();

    const { data: courses } = await supabaseServer
      .from('courses')
      .select('*')
      .eq('user_id', user.id);
    const courseIds = (courses ?? []).map((c) => c.id);

    const { data: topics } = await supabaseServer
      .from('topics')
      .select('*')
      .in('course_id', courseIds);
    const topicIds = (topics ?? []).map((t) => t.id);

    // All sessions
    const { data: sessions } = await supabaseServer
      .from('study_sessions')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('session_date', { ascending: true });

    // All quiz scores
    const { data: quizzes } = await supabaseServer
      .from('quiz_scores')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('quiz_date', { ascending: true });

    const quizList = quizzes ?? [];
    const topicList = topics ?? [];
    const sessionList = sessions ?? [];
    const courseList = courses ?? [];

    // Total stats
    const totalMinutes = sessionList.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalSessions = sessionList.length;

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

    // Weekly study time (last 12 weeks)
    const weeklyData = Array.from({ length: 12 }).map((_, i) => {
      const weekStart = subDays(new Date(), (11 - i) * 7);
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(subDays(new Date(), (11 - i) * 7 - 6), 'yyyy-MM-dd');
      const weekMinutes = sessionList
        .filter((s) => s.session_date >= weekStartStr && s.session_date <= weekEndStr)
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        label: format(weekStart, 'MMM d'),
        minutes: weekMinutes,
        hours: Math.round((weekMinutes / 60) * 10) / 10,
      };
    });

    // Monthly study time (last 6 months)
    const monthlyData = Array.from({ length: 6 }).map((_, i) => {
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1);
      const mStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      const monthMinutes = sessionList
        .filter((s) => s.session_date >= mStart && s.session_date <= mEnd)
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        label: format(monthDate, 'MMM'),
        minutes: monthMinutes,
        hours: Math.round((monthMinutes / 60) * 10) / 10,
      };
    });

    // Quiz score trends (all quizzes chronologically)
    const quizTrendData = quizList.map((q) => ({
      date: format(parseISO(q.quiz_date), 'MMM d'),
      score: Math.round((q.score / q.total_questions) * 100),
      topic: q.topic?.title ?? '—',
    }));

    // Confidence growth over time (based on session confidence_after)
    const confidenceData = [...sessionList]
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .map((s) => ({
        date: format(parseISO(s.session_date), 'MMM d'),
        before: s.confidence_before,
        after: s.confidence_after,
      }));

    // Time per course
    const timePerCourse = courseList.map((c) => {
      const courseTopicIds = topicList.filter((t) => t.course_id === c.id).map((t) => t.id);
      const courseMinutes = sessionList
        .filter((s) => courseTopicIds.includes(s.topic_id))
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        name: c.title,
        color: c.color,
        minutes: courseMinutes,
        hours: Math.round((courseMinutes / 60) * 10) / 10,
      };
    }).filter((c) => c.minutes > 0);

    return NextResponse.json({
      totalMinutes,
      totalSessions,
      avgQuizScore,
      avgConfidence,
      activeCourses: courseList.filter((c) => c.status === 'Active').length,
      weeklyData,
      monthlyData,
      quizTrendData,
      confidenceData,
      timePerCourse,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch statistics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { supabase } from '@/lib/supabase/client';
import type {
  Course,
  Topic,
  StudySession,
  Note,
  QuizScore,
  StudySessionWithTopic,
  NoteWithTopic,
  QuizScoreWithTopic,
} from '@/types';

// ===================== Courses =====================
export const coursesApi = {
  async list(): Promise<Course[]> {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async get(id: string): Promise<Course | null> {
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async create(input: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase.from('courses').insert(input).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase.from('courses').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
  },
};

// ===================== Topics =====================
export const topicsApi = {
  async list(courseId?: string): Promise<Topic[]> {
    let q = supabase.from('topics').select('*').order('created_at', { ascending: false });
    if (courseId) q = q.eq('course_id', courseId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async create(input: Partial<Topic>): Promise<Topic> {
    const { data, error } = await supabase.from('topics').insert(input).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<Topic>): Promise<Topic> {
    const { data, error } = await supabase.from('topics').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) throw error;
  },
};

// ===================== Study Sessions =====================
export const sessionsApi = {
  async list(topicId?: string): Promise<StudySessionWithTopic[]> {
    let q = supabase
      .from('study_sessions')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('session_date', { ascending: false });
    if (topicId) q = q.eq('topic_id', topicId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as StudySessionWithTopic[];
  },
  async create(input: Partial<StudySession>): Promise<StudySession> {
    const { data, error } = await supabase.from('study_sessions').insert(input).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<StudySession>): Promise<StudySession> {
    const { data, error } = await supabase.from('study_sessions').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id);
    if (error) throw error;
  },
};

// ===================== Notes =====================
export const notesApi = {
  async list(topicId?: string, search?: string): Promise<NoteWithTopic[]> {
    let q = supabase
      .from('notes')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('created_at', { ascending: false });
    if (topicId) q = q.eq('topic_id', topicId);
    if (search) q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as NoteWithTopic[];
  },
  async create(input: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase.from('notes').insert(input).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase.from('notes').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },
};

// ===================== Quiz Scores =====================
export const quizzesApi = {
  async list(topicId?: string): Promise<QuizScoreWithTopic[]> {
    let q = supabase
      .from('quiz_scores')
      .select('*, topic:topics(id, title, course:courses(id, title, color))')
      .order('quiz_date', { ascending: false });
    if (topicId) q = q.eq('topic_id', topicId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as QuizScoreWithTopic[];
  },
  async create(input: Partial<QuizScore>): Promise<QuizScore> {
    const { data, error } = await supabase.from('quiz_scores').insert(input).select('*').single();
    if (error) throw error;
    return data;
  },
  async update(id: string, input: Partial<QuizScore>): Promise<QuizScore> {
    const { data, error } = await supabase.from('quiz_scores').update(input).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('quiz_scores').delete().eq('id', id);
    if (error) throw error;
  },
};

// ===================== Reviews =====================
export const reviewsApi = {
  async list(filter: 'due' | 'overdue' | 'upcoming'): Promise<(Topic & { course?: Pick<Course, 'id' | 'title' | 'color' | 'icon'> })[]> {
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase
      .from('topics')
      .select('*, course:courses(id, title, color, icon)')
      .not('next_review_date', 'is', null)
      .order('next_review_date', { ascending: true });
    if (filter === 'due') q = q.lte('next_review_date', today);
    else if (filter === 'overdue') q = q.lt('next_review_date', today);
    else q = q.gt('next_review_date', today);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as (Topic & { course?: Pick<Course, 'id' | 'title' | 'color' | 'icon'> })[];
  },
  async complete(topicId: string, confidenceLevel: number): Promise<Topic> {
    const { suggestReviewDate } = await import('@/lib/spaced-repetition');
    const nextDate = suggestReviewDate(confidenceLevel).toISOString().slice(0, 10);
    const updateData = {
      confidence_level: confidenceLevel,
      status: confidenceLevel >= 5 ? 'Mastered' : confidenceLevel >= 4 ? 'Reviewing' : 'Learning',
      next_review_date: nextDate,
    };
    const { data, error } = await supabase.from('topics').update(updateData).eq('id', topicId).select('*').single();
    if (error) throw error;
    return data;
  },
};

// ===================== Dashboard =====================
export async function fetchDashboard() {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

// ===================== Statistics =====================
export async function fetchStatistics() {
  const res = await fetch('/api/statistics');
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

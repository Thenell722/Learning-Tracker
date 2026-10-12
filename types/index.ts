export type CourseStatus = 'Active' | 'Paused' | 'Completed';
export type TopicStatus = 'NotStarted' | 'Learning' | 'Reviewing' | 'Mastered';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  status: CourseStatus;
  target_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  course_id: string;
  title: string;
  description: string;
  status: TopicStatus;
  confidence_level: 1 | 2 | 3 | 4 | 5;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  topic_id: string;
  session_date: string;
  duration_minutes: number;
  summary: string;
  confidence_before: number;
  confidence_after: number;
  created_at: string;
}

export interface Note {
  id: string;
  topic_id: string;
  session_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface QuizScore {
  id: string;
  topic_id: string;
  score: number;
  total_questions: number;
  quiz_date: string;
  notes: string;
  created_at: string;
}

// Extended types with joined relations for convenience
export interface CourseWithStats extends Course {
  topic_count?: number;
  studied_minutes?: number;
  topics?: Topic[];
}

export interface TopicWithCourse extends Topic {
  course?: Pick<Course, 'id' | 'title' | 'color' | 'icon'>;
}

export interface StudySessionWithTopic extends StudySession {
  topic?: Pick<Topic, 'id' | 'title'> & {
    course?: Pick<Course, 'id' | 'title' | 'color'>;
  };
}

export interface NoteWithTopic extends Note {
  topic?: Pick<Topic, 'id' | 'title'> & {
    course?: Pick<Course, 'id' | 'title' | 'color'>;
  };
}

export interface QuizScoreWithTopic extends QuizScore {
  topic?: Pick<Topic, 'id' | 'title'> & {
    course?: Pick<Course, 'id' | 'title' | 'color'>;
  };
}

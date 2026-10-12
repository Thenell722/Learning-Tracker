export const COURSE_COLORS = [
  { name: 'blue', class: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { name: 'green', class: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { name: 'orange', class: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { name: 'red', class: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  { name: 'purple', class: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { name: 'cyan', class: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  { name: 'pink', class: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  { name: 'amber', class: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  { name: 'teal', class: 'bg-teal-500', text: 'text-teal-500', light: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  { name: 'indigo', class: 'bg-indigo-500', text: 'text-indigo-500', light: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
] as const;

export function getColorClasses(name: string) {
  return COURSE_COLORS.find((c) => c.name === name) ?? COURSE_COLORS[0];
}

// Icon names must match lucide-react exports
export const COURSE_ICONS = [
  'BookOpen', 'Code', 'Brain', 'Languages', 'Network',
  'Database', 'Music', 'Palette', 'Rocket', 'Atom',
  'Calculator', 'Globe', 'FlaskConical', 'BookMarked', 'Pencil',
] as const;

export const COURSE_STATUSES = ['Active', 'Paused', 'Completed'] as const;
export const TOPIC_STATUSES = ['NotStarted', 'Learning', 'Reviewing', 'Mastered'] as const;

export const TOPIC_STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Not Started',
  Learning: 'Learning',
  Reviewing: 'Reviewing',
  Mastered: 'Mastered',
};

export const TOPIC_STATUS_COLORS: Record<string, string> = {
  NotStarted: 'bg-muted text-muted-foreground',
  Learning: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Reviewing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Mastered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const COURSE_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
};

import { supabaseServer } from './server';
import type { User } from '@/types';

/**
 * Returns the single seeded user for this personal app.
 * Creates one if none exists yet.
 */
export async function getDefaultUser(): Promise<User> {
  const { data: existing } = await supabaseServer
    .from('users')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (existing) return existing as User;

  const { data, error } = await supabaseServer
    .from('users')
    .insert({ name: 'Learner', email: 'learner@example.com' })
    .select('*')
    .single();

  if (error) throw error;
  return data as User;
}

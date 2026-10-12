'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, StickyNote, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { NoteFormDialog } from '@/components/note-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { RowSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notesApi } from '@/lib/api';
import { getColorClasses } from '@/lib/constants';
import { toast } from 'sonner';
import type { NoteWithTopic } from '@/types';
import { format, parseISO } from 'date-fns';

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteWithTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithTopic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await notesApi.list();
      setNotes(data as NoteWithTopic[]);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await notesApi.remove(deleteId); toast.success('Note deleted'); setDeleteId(null); loadData(); }
    catch { toast.error('Failed to delete note'); }
  };

  return (
    <div>
      <PageHeader title="Notes" description="All your study notes, searchable and organized by topic.">
        <Button onClick={() => { setEditingNote(null); setDialogOpen(true); }} size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </PageHeader>

      {/* Search bar — editorial style */}
      <div className="relative mb-8 border-y border-border py-4">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes by title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 pl-7 text-lg font-display focus-visible:ring-0 focus-visible:ring-transparent bg-transparent"
        />
        {filtered.length > 0 && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {loading ? (
        <RowSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={search ? "No matching notes" : "No notes yet"}
          description={search ? "Try a different search term." : "Add notes to topics to capture key learnings."}
          actionLabel={!search ? "New Note" : undefined}
          onAction={!search ? () => { setEditingNote(null); setDialogOpen(true); } : undefined}
        />
      ) : (
        <div className="divide-y divide-border border-y border-border animate-fade-in">
          {filtered.map((note) => {
            const colorClasses = getColorClasses(note.topic?.course?.color ?? 'blue');
            return (
              <div key={note.id} className="group py-5 hover:bg-muted/20 transition-colors -mx-2 px-2">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/topics/${note.topic_id}`}>
                      <h3 className="font-display text-lg font-semibold hover:text-primary transition-colors">{note.title}</h3>
                    </Link>
                    {note.content && (
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <Link href={`/topics/${note.topic_id}`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${colorClasses.text.replace('text-', 'bg-')}`} />
                        {note.topic?.title ?? 'Unknown'}
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{format(parseISO(note.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingNote(note); setDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(note.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NoteFormDialog open={dialogOpen} onOpenChange={setDialogOpen} note={editingNote} onSaved={loadData} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Note?" description="This will permanently delete this note." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Comment } from '../types';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface CommentsSectionProps {
  novelId: string;
  chapterId?: string;
}

export default function CommentsSection({ novelId, chapterId }: CommentsSectionProps) {
  const { user, login } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('novelId', '==', novelId),
      where('chapterId', '==', chapterId || null),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
      setLoading(false);
    }, (error) => {
      console.error('Comments error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [novelId, chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login();
      return;
    }
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        userId: user.uid,
        userName: user.displayName || 'Reader',
        userPhoto: user.photoURL,
        content: newComment.trim(),
        novelId,
        chapterId: chapterId || null,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (e) {
      console.error('Error posting comment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h3 className="font-serif text-2xl font-bold">Reader Reflections</h3>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "A thought for the ages..." : "Sign in to share your reflection..."}
          className="w-full rounded-[2rem] border border-zinc-200 bg-white p-6 pb-16 text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
          rows={3}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {newComment.length} chars
          </span>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group flex gap-4 rounded-[2rem] bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800"
            >
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-900">
                {comment.userPhoto ? (
                  <img src={comment.userPhoto} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 italic">
                    {comment.userName}
                  </h4>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {comment.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="rounded-[2.5rem] border-2 border-dashed border-zinc-100 py-16 text-center dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Be the first to reflect on this chapter</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Bookmark } from '../types';
import { Bookmark as BookmarkIcon, ChevronRight, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';

function BookmarkItem({ bookmark }: { bookmark: Bookmark; key?: string | number }) {
  const { translated: translatedTitle, loading } = useTranslation(bookmark.novelTitle);

  return (
    <Link 
      to={`/novel/${bookmark.novelId}`}
      className="group flex gap-6 overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 hover:shadow-xl hover:shadow-indigo-500/5 dark:bg-zinc-900/40 dark:ring-zinc-800"
    >
      <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg">
        <img 
          src={bookmark.coverUrl} 
          alt={bookmark.novelTitle} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Saved Story</p>
        <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-indigo-600 transition-colors">
          {loading ? <span className="animate-pulse opacity-50">...</span> : translatedTitle}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Added Recently</span>
      </div>
      <div className="flex items-center pr-2">
        <div className="rounded-full bg-zinc-100 p-2 text-zinc-300 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:translate-x-1 dark:bg-zinc-800">
           <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'users', auth.currentUser.uid, 'bookmarks'),
          orderBy('addedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setBookmarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark)));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'bookmarks');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-8 text-center uppercase tracking-[0.2em]">
         <h2 className="font-serif text-3xl font-bold tracking-normal low-case">Login to view your saved stories.</h2>
         <button 
           onClick={() => document.getElementById('login-btn')?.click()}
           className="rounded-full bg-indigo-600 px-10 py-5 text-xs font-bold text-white transition-all hover:scale-105"
         >
           Join Library
         </button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Opening Your Private Collection</p>
    </div>
  );

  return (
    <div className="space-y-12 py-8">
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-12 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
         <div className="space-y-2">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">
               <BookmarkIcon className="h-4 w-4" />
               Saved Items
            </div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Your Private Library</h1>
         </div>
         <p className="max-w-xs text-sm text-zinc-400">
           Curated by you, for quiet moments of reading.
         </p>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {bookmarks.map((bookmark) => (
                <BookmarkItem key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500 border-2 border-dashed border-zinc-100 rounded-[3rem] dark:border-zinc-800">
           <BookmarkIcon className="h-12 w-12 mb-6 text-zinc-200" />
           <p className="font-serif text-2xl font-bold text-zinc-400 mb-8">Your shelves are waiting to be filled.</p>
           <Link to="/" className="inline-flex items-center gap-3 rounded-full bg-indigo-600 px-10 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-105 shadow-xl shadow-indigo-500/20">
             Explore Stories
             <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, setDoc, deleteDoc, serverTimestamp, where, limit, addDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Novel, Chapter, Bookmark } from '../types';
import { Bookmark as BookmarkIcon, Play, ChevronRight, Clock, Star, BookOpen, Share2, Users, Loader2, Sparkles, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import CommentsSection from '../components/CommentsSection';

export default function NovelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { login } = useAuth();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Novel[]>([]);
  const [hasLiked, setHasLiked] = useState(false);

  const { translated: translatedTitle, loading: titleLoading } = useTranslation(novel?.title);
  const { translated: translatedDescription, loading: descLoading } = useTranslation(novel?.description);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const novelDoc = await getDoc(doc(db, 'novels', id));
        if (novelDoc.exists()) {
          const novelData = { id: novelDoc.id, ...novelDoc.data() } as Novel;
          setNovel(novelData);

          // Fetch Recommendations (Smart Interests)
          const recQuery = query(
            collection(db, 'novels'),
            where('category', '==', novelData.category),
            limit(5)
          );
          const recSnapshot = await getDocs(recQuery);
          setRecommendations(recSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Novel))
            .filter(n => n.id !== id)
          );
        }

        const chaptersSnapshot = await getDocs(query(collection(db, 'novels', id, 'chapters'), orderBy('chapterNumber', 'asc')));
        setChapters(chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter)));

        if (auth.currentUser) {
          const bookmarkDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'bookmarks', id));
          setIsBookmarked(bookmarkDoc.exists());

          const likeQuery = query(
            collection(db, 'interactions'),
            where('userId', '==', auth.currentUser.uid),
            where('targetId', '==', id),
            where('type', '==', 'like')
          );
          const likeSnapshot = await getDocs(likeQuery);
          setHasLiked(!likeSnapshot.empty);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `novels/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleLike = async () => {
    if (!auth.currentUser) {
      login();
      return;
    }
    if (!novel) return;

    try {
      if (hasLiked) {
        const q = query(
          collection(db, 'interactions'),
          where('userId', '==', auth.currentUser.uid),
          where('targetId', '==', id),
          where('type', '==', 'like')
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
          await deleteDoc(doc(db, 'interactions', d.id));
        });
        setHasLiked(false);
      } else {
        await addDoc(collection(db, 'interactions'), {
          userId: auth.currentUser.uid,
          targetId: id!,
          targetType: 'novel',
          type: 'like',
          createdAt: serverTimestamp(),
        });
        setHasLiked(true);
      }
    } catch (e) {
      console.error('Error toggling like:', e);
    }
  };

  const toggleBookmark = async () => {
    if (!auth.currentUser) {
      login();
      return;
    }
    if (!novel) return;
    const bookmarkRef = doc(db, 'users', auth.currentUser.uid, 'bookmarks', novel.id);
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        const bookmarkData: Omit<Bookmark, 'id'> = {
          novelId: novel.id,
          novelTitle: novel.title,
          coverUrl: novel.coverUrl,
          addedAt: serverTimestamp() as any,
        };
        await setDoc(bookmarkRef, bookmarkData);
        setIsBookmarked(true);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `bookmarks/${novel.id}`);
    }
  };

  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Loading Story Insight</p>
    </div>
  );

  if (!novel) return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 text-center">
      <h2 className="font-serif text-3xl font-bold">Lost in the Stacks.</h2>
      <p className="text-zinc-500">The novel you seek is currently unavailable in this dimension.</p>
      <Link to="/" className="text-sm font-bold uppercase tracking-widest text-indigo-600 underline underline-offset-8">Return to Library</Link>
    </div>
  );

  return (
    <div className="space-y-16 py-8">
      {/* Header Section - Prestige Style */}
      <section className="relative overflow-hidden rounded-[3rem] bg-zinc-900 px-8 py-16 text-white shadow-2xl md:px-16 md:py-24">
        <div className="absolute inset-0 opacity-10">
          <img src={novel.coverUrl} className="h-full w-full object-cover blur-3xl scale-110" referrerPolicy="no-referrer" />
        </div>
        
        <div className="relative flex flex-col gap-12 md:flex-row md:items-end">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="group relative w-56 self-center md:w-72 flex-shrink-0"
          >
            <img 
              src={novel.coverUrl} 
              className="relative z-10 w-full rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl border border-white/10" />
          </motion.div>
          
          <div className="flex-1 space-y-8">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">{novel.category}</span>
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md ring-1 ring-white/10">
                <BookOpen className="h-3 w-3" />
                {chapters.length} Chapters
              </span>
            </div>
            
            <div className="space-y-4">
               <h1 className="font-serif text-5xl font-bold leading-[1.1] md:text-7xl">
                 {titleLoading ? <span className="animate-pulse opacity-50">...</span> : translatedTitle}
               </h1>
               <p className="text-xl font-light text-zinc-400">by <span className="font-medium text-white">{novel.author}</span></p>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <Link 
                to={chapters.length > 0 ? `/read/${novel.id}/1` : '#'} 
                className={cn(
                  "group flex items-center gap-3 rounded-full bg-white px-10 py-5 text-xs font-bold uppercase tracking-widest text-zinc-950 transition-all hover:bg-indigo-50 hover:scale-105 active:scale-95",
                  chapters.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-125" />
                Begin Legend
              </Link>
              
              <button 
                onClick={toggleBookmark}
                className={cn(
                  "flex items-center gap-3 rounded-full border px-8 py-5 text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-md",
                  isBookmarked ? "border-indigo-600 bg-indigo-600 text-white" : "border-white/20 bg-white/5 hover:bg-white/10"
                )}
              >
                <BookmarkIcon className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                {isBookmarked ? 'In Library' : 'Save Story'}
              </button>

              <button 
                onClick={toggleLike}
                className={cn(
                  "flex items-center gap-3 rounded-full border px-8 py-5 text-xs font-bold uppercase tracking-widest transition-all backdrop-blur-md",
                  hasLiked ? "border-rose-500 bg-rose-500 text-white" : "border-white/20 bg-white/5 hover:bg-white/10"
                )}
              >
                <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
                {hasLiked ? 'Enchanted' : 'Enchant'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-20 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-20">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="h-px w-8 bg-indigo-600" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Synopsis</h2>
            </div>
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {descLoading ? (
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ) : (
                <p className="font-serif text-2xl leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {translatedDescription}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-indigo-600" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Chapter Selection</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{chapters.length} Installments</span>
            </div>
            
            <div className="grid gap-4">
              {chapters.map((chapter) => (
                <Link 
                  key={chapter.id} 
                  to={`/read/${novel.id}/${chapter.chapterNumber}`}
                  className="group flex items-center justify-between rounded-[2rem] bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white font-serif text-lg font-bold shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-zinc-800">
                      {chapter.chapterNumber}
                    </div>
                    <div>
                      <h4 className="font-serif text-xl font-bold group-hover:text-indigo-600 transition-colors">{chapter.title}</h4>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Anthology Entry</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-white p-2 text-zinc-300 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:translate-x-1 dark:bg-zinc-800">
                     <ChevronRight className="h-5 w-5" />
                  </div>
                </Link>
              ))}
              {chapters.length === 0 && (
                <div className="rounded-[3rem] border-2 border-dashed border-zinc-100 p-20 text-center dark:border-zinc-800">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Ink is still drying. Chapters coming soon.</p>
                </div>
              )}
            </div>
          </section>

          <section className="pt-20 border-t border-zinc-100 dark:border-zinc-800">
            <CommentsSection novelId={id!} />
          </section>
        </div>

        <aside className="space-y-8">
           <div className="rounded-[3rem] bg-white p-10 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-800">
              <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Metadata</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Temporal Depth</span>
                  </div>
                  <span className="text-xs font-bold tracking-tight">~4h 20m</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <Star className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Global Status</span>
                  </div>
                  <span className="text-xs font-bold tracking-tight">High Acclaim</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Engaged Souls</span>
                  </div>
                  <span className="text-xs font-bold tracking-tight">{novel.readerCount || 0}</span>
                </div>
              </div>
              <button className="mt-12 flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-50 py-4 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                <Share2 className="h-4 w-4" />
                Invite Others
              </button>
           </div>
           
           <div className="rounded-[2.5rem] bg-indigo-50 p-8 dark:bg-indigo-950/20">
              <div className="flex items-center gap-3 mb-4">
                 <Sparkles className="h-4 w-4 text-indigo-600" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-900 dark:text-indigo-400">AI Translator Active</h4>
              </div>
              <p className="text-xs leading-relaxed text-indigo-900/70 dark:text-indigo-400/70">
                Our advanced Gemini AI is currently providing a nuanced translation to your selected language.
              </p>
           </div>
        </aside>
      </div>

      {/* Smart Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="mt-24 space-y-12 border-t border-zinc-100 pt-24 dark:border-zinc-800">
           <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">
                 <Sparkles className="h-3 w-3" />
                 More interested in {novel.category}?
              </div>
              <h2 className="font-serif text-4xl font-bold md:text-5xl">You might also love...</h2>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <Link 
                key={rec.id} 
                to={`/novel/${rec.id}`}
                onClick={() => window.scrollTo(0, 0)}
                className="group space-y-4"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800">
                   <img src={rec.coverUrl} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xl font-bold group-hover:text-indigo-600 transition-colors line-clamp-1">{rec.title}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{rec.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

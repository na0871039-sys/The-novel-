import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, doc, getDoc, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Novel, ReadingProgress } from '../types';
import NovelCard from '../components/NovelCard';
import { BookOpen, Sparkles, History, ArrowRight, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { login } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [recentProgress, setRecentProgress] = useState<(ReadingProgress & { novel?: Novel })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommended, setRecommended] = useState<Novel[]>([]);
  const [trending, setTrending] = useState<Novel[]>([]);
  const [newest, setNewest] = useState<Novel[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'novels'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const novelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
        setNovels(novelsData);
        setNewest(novelsData.slice(0, 4));

        // Mock Trending (based on readerCount)
        const trendQ = query(collection(db, 'novels'), orderBy('readerCount', 'desc'), limit(4));
        const trendSnapshot = await getDocs(trendQ);
        setTrending(trendSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Novel)));

        if (auth.currentUser) {
          const progressQ = query(
            collection(db, 'users', auth.currentUser.uid, 'progress'),
            orderBy('lastReadAt', 'desc'),
            limit(5)
          );
          const progressSnapshot = await getDocs(progressQ);
          const progressData = await Promise.all(progressSnapshot.docs.map(async (d) => {
            const data = d.data() as ReadingProgress;
            const novelDoc = await getDoc(doc(db, 'novels', d.id));
            return {
              ...data,
              novel: novelDoc.exists() ? { id: novelDoc.id, ...novelDoc.data() } as Novel : undefined
            };
          }));
          setRecentProgress(progressData);

          // Simple Recommendation Logic: Stories from the same category as the most recent read
          if (progressData.length > 0 && progressData[0].novel) {
            const lastCategory = progressData[0].novel.category;
            const recQ = query(
              collection(db, 'novels'),
              where('category', '==', lastCategory),
              limit(4)
            );
            const recSnapshot = await getDocs(recQ);
            setRecommended(recSnapshot.docs
              .map(d => ({ id: d.id, ...d.data() } as Novel))
              .filter(n => n.id !== progressData[0].novel?.id)
            );
          }
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredNovels = novels.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Curating Librarian Selection</p>
    </div>
  );

  return (
    <div className="space-y-24 pb-24">
      {/* Search Header */}
      <div className="flex items-center justify-between">
         <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Library Catalog</h2>
         <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 focus-within:border-indigo-600 transition-all dark:border-zinc-800 dark:bg-zinc-900/50">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-medium outline-none placeholder:text-zinc-400"
            />
         </div>
      </div>

      {/* Hero Section - Magazine Style */}
      <section className="relative overflow-hidden rounded-[3rem] bg-zinc-900 px-8 py-24 md:px-16 md:py-32">
        <div className="absolute inset-0 opacity-20">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-transparent" />
           <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/30 blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 flex items-center gap-3"
          >
            <span className="h-px w-8 bg-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">The Modern Library</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl font-bold leading-[1.1] text-white md:text-7xl"
          >
            Stories Without <br /><span className="italic text-indigo-400">Boundaries.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 max-w-lg text-lg leading-relaxed text-zinc-400"
          >
            Access a vast collection of premium novels translated in real-time by advanced AI. 
            Immerse yourself in high-quality literature, regardless of language.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap gap-4"
          >
            <a 
              href="#collection" 
              className="group flex items-center gap-3 rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-900 transition-all hover:bg-indigo-50 hover:scale-105"
            >
              Start Reading
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            {!auth.currentUser && (
              <button 
                onClick={login}
                className="rounded-full border border-zinc-700 bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/5"
              >
                Join Library
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Continue Reading */}
      {recentProgress.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/40">
               <History className="h-5 w-5" />
             </div>
             <h2 className="font-serif text-3xl font-bold">Resuming Your Journey</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentProgress.map((progress) => (
              progress.novel && (
                <Link 
                  key={progress.novelId}
                  to={`/read/${progress.novelId}/${progress.lastChapterNumber}`}
                  className="group flex items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                    <img src={progress.novel.coverUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Chapter {progress.lastChapterNumber}</p>
                    <h4 className="truncate font-serif text-lg font-bold">{progress.novel.title}</h4>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-400">Continue Reading</p>
                  </div>
                  <div className="rounded-full bg-zinc-100 p-3 group-hover:bg-indigo-600 group-hover:text-white dark:bg-zinc-800 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              )
            ))}
          </div>
        </section>
      )}

      {/* Interested Stories - Recommendations */}
      {recommended.length > 0 && (
        <section className="space-y-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500">
                 <Sparkles className="h-3 w-3" />
                 Interested Stories
              </div>
              <h2 className="font-serif text-4xl font-bold md:text-5xl">Stories You'll Love</h2>
            </div>
            <p className="max-w-xs text-sm text-zinc-400">
              Based on your passion for <span className="text-indigo-600 font-bold">{recentProgress[0]?.novel?.category}</span>.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="space-y-12">
          <div className="flex items-center gap-4">
             <div className="h-px w-8 bg-zinc-900 dark:bg-white" />
             <h2 className="font-serif text-4xl font-bold">Trending Narratives</h2>
          </div>
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </section>
      )}

      {/* Novel Collection */}
      <section id="collection" className="space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-zinc-100 pb-8 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">
               <Sparkles className="h-3 w-3" />
               Latest Picks
            </div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">Library Collection</h2>
          </div>
          <p className="max-w-xs text-sm text-zinc-400">
            Hand-picked stories from across the globe, translated for your soul.
          </p>
        </div>

        {filteredNovels.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800/50">
             <BookOpen className="mb-4 h-12 w-12 text-zinc-200" />
             <p className="font-medium text-zinc-400">The library shelves are currently empty.</p>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        )}
      </section>

      {/* Join CTA */}
      {!auth.currentUser && (
        <section className="rounded-[4rem] bg-indigo-600 p-12 text-center text-white md:p-24 overflow-hidden relative">
           <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500 blur-[100px] opacity-50" />
           <div className="relative z-10 mx-auto max-w-xl space-y-8">
              <h2 className="font-serif text-4xl font-bold md:text-6xl">Ready for your next chapter?</h2>
              <p className="text-lg text-indigo-100">
                Join our community of global readers and save your bookmarks, track your progress, 
                and get personalized recommendations.
              </p>
              <button 
                onClick={login}
                className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-sm font-bold uppercase tracking-widest text-indigo-600 shadow-2xl transition-all hover:scale-105"
              >
                Become a Member
                <ArrowRight className="h-4 w-4" />
              </button>
           </div>
        </section>
      )}
    </div>
  );
}

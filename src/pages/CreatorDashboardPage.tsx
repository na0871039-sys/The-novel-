import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Novel, Interaction } from '../types';
import { Users, Heart, BookOpen, BarChart2, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CreatorDashboardPage() {
  const { user } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCreatorData = async () => {
      try {
        // Fetch creator's novels
        const nq = query(collection(db, 'novels'), where('creatorId', '==', user.uid));
        const nSnapshot = await getDocs(nq);
        const nData = nSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
        setNovels(nData);

        // Fetch recent interactions related to these novels
        if (nData.length > 0) {
          const novelIds = nData.map(n => n.id);
          // Firestore 'in' query has limit of 10, so we might need to chunk or just fetch all and filter
          // For simplicity in this demo, we'll fetch general interactions and filter in memory if needed
          // or just fetch by targetType 'novel'
          const iq = query(
            collection(db, 'interactions'),
            where('targetType', '==', 'novel'),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          const iSnapshot = await getDocs(iq);
          const iData = iSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Interaction))
            .filter(i => novelIds.includes(i.targetId));
          setInteractions(iData);
        }
      } catch (e) {
        console.error('Dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [user]);

  if (!user) return <div className="p-20 text-center">Please sign in to view your dashboard.</div>;
  if (loading) return (
    <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Synthesizing Creator Analytics</p>
    </div>
  );

  const totalViews = novels.reduce((acc, n) => acc + (n.readerCount || 0), 0);
  const totalLikes = novels.reduce((acc, n) => acc + (n.likesCount || 0), 0);

  // Mock data for the chart based on interactions
  const chartData = [
    { day: 'Mon', views: 120, likes: 45 },
    { day: 'Tue', views: 150, likes: 52 },
    { day: 'Wed', views: 180, likes: 61 },
    { day: 'Thu', views: 190, likes: 58 },
    { day: 'Fri', views: 250, likes: 88 },
    { day: 'Sat', views: 320, likes: 110 },
    { day: 'Sun', views: 300, likes: 95 },
  ];

  return (
    <div className="space-y-12 py-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600">
           <BarChart2 className="h-4 w-4" />
           Narrative Intelligence
        </div>
        <h1 className="font-serif text-5xl font-bold">Creator Dashboard</h1>
        <p className="text-zinc-500">Monitor the resonance of your words across global cultures.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-800"
        >
          <div className="flex items-center justify-between mb-6">
             <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40">
               <BookOpen className="h-6 w-6" />
             </div>
             <div className="flex items-center gap-1 text-xs font-bold text-green-500">
               <ArrowUpRight className="h-4 w-4" />
               12%
             </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Stories</p>
          <h2 className="text-4xl font-bold tracking-tight mt-2">{novels.length}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-800"
        >
          <div className="flex items-center justify-between mb-6">
             <div className="rounded-2xl bg-orange-50 p-3 text-orange-600 dark:bg-orange-950/40">
               <Users className="h-6 w-6" />
             </div>
             <div className="flex items-center gap-1 text-xs font-bold text-green-500">
               <ArrowUpRight className="h-4 w-4" />
               24%
             </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cumulative Readers</p>
          <h2 className="text-4xl font-bold tracking-tight mt-2">{totalViews}</h2>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900/50 dark:ring-zinc-800"
        >
          <div className="flex items-center justify-between mb-6">
             <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/40">
               <Heart className="h-6 w-6" />
             </div>
             <div className="flex items-center gap-1 text-xs font-bold text-rose-500">
               <TrendingUp className="h-4 w-4" />
               8%
             </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Enchantments</p>
          <h2 className="text-4xl font-bold tracking-tight mt-2">{totalLikes}</h2>
        </motion.div>
      </div>

      {/* Engagement Chart */}
      <section className="rounded-[3rem] bg-zinc-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="mb-10 space-y-2">
          <h3 className="font-serif text-2xl font-bold">Resonance Trend</h3>
          <p className="text-xs text-zinc-400 uppercase tracking-widest">Last 7 Cycles of Impact</p>
        </div>
        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#818cf8" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="likes" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Narratives Activity */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Your Active Scrolls</h3>
          <div className="space-y-4">
            {novels.map(novel => (
              <div key={novel.id} className="flex items-center justify-between rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                <div className="flex items-center gap-4">
                  <img src={novel.coverUrl} className="h-12 w-10 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-serif text-lg font-bold">{novel.title}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{novel.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{novel.readerCount}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Readers</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Recent Echoes</h3>
          <div className="space-y-4">
            {interactions.map(interaction => (
              <div key={interaction.id} className="flex items-center justify-between rounded-[2rem] bg-zinc-50 p-6 dark:bg-zinc-900/30">
                 <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      interaction.type === 'like' ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
                    )}>
                      {interaction.type === 'like' ? <Heart className="h-5 w-5 fill-current" /> : <TrendingUp className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{interaction.type === 'like' ? 'Enchanted your story' : 'Began reading'}</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">A moment ago</p>
                    </div>
                 </div>
                 <div className="h-2 w-2 rounded-full bg-indigo-600" />
              </div>
            ))}
            {interactions.length === 0 && (
              <div className="py-20 text-center text-zinc-400 italic">No echoes recorded yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

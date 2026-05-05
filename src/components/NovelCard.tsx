import { Link } from 'react-router-dom';
import { Novel } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { BookOpen, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NovelCardProps {
  novel: Novel;
  key?: string | number;
}

export default function NovelCard({ novel }: NovelCardProps) {
  const { translated: translatedTitle, loading: titleLoading } = useTranslation(novel.title);
  const { translated: translatedDescription, loading: descLoading } = useTranslation(novel.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative h-full flex flex-col overflow-hidden rounded-3xl bg-white transition-all hover:bg-zinc-50 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
    >
      <Link to={`/novel/${novel.id}`} className="absolute inset-0 z-10" />
      
      <div className="relative aspect-[3/4] overflow-hidden">
        {novel.coverUrl ? (
          <img
            src={novel.coverUrl}
            alt={novel.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
             <BookOpen className="h-12 w-12 text-zinc-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
            <User className="h-3 w-3" />
            {novel.author}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2">
          <h3 className={cn(
            "font-serif text-xl font-bold leading-tight group-hover:text-indigo-600 transition-colors",
            titleLoading && "animate-pulse bg-zinc-100 dark:bg-zinc-800 text-transparent rounded"
          )}>
            {translatedTitle}
          </h3>
        </div>
        
        <p className={cn(
          "line-clamp-3 text-sm leading-relaxed text-zinc-500",
          descLoading && "animate-pulse bg-zinc-100/50 dark:bg-zinc-800/50 text-transparent rounded"
        )}>
          {translatedDescription}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Chapters Available</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/40">
            ?
          </span>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, setDoc, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Chapter } from '../types';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Settings, Moon, Sun, Type, ArrowLeft, Volume2, VolumeX, Loader2, Music, Image as ImageIcon, Video, Heart, Share2, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import CommentsSection from '../components/CommentsSection';

export default function ReaderPage() {
  const { novelId, chapterNumber } = useParams<{ novelId: string, chapterNumber: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [showSettings, setShowSettings] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off, 1-5 speed
  const [isBilingual, setIsBilingual] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { translated: translatedTitle, loading: titleLoading } = useTranslation(chapter?.title);
  const { translated: translatedContent, loading: contentLoading } = useTranslation(chapter?.content);

  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!auth.currentUser || !chapter) return;
    const checkLike = async () => {
      const q = query(
        collection(db, 'interactions'),
        where('userId', '==', auth.currentUser?.uid),
        where('targetId', '==', chapter.id),
        where('type', '==', 'like')
      );
      const snapshot = await getDocs(q);
      setHasLiked(!snapshot.empty);
    };
    checkLike();
  }, [chapter, auth.currentUser]);

  // Analytics: Track View
  useEffect(() => {
    if (!chapter || !auth.currentUser) return;
    const timer = setTimeout(async () => {
      try {
        await addDoc(collection(db, 'interactions'), {
          userId: auth.currentUser?.uid,
          targetId: chapter.id,
          targetType: 'chapter',
          type: 'view',
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error('Analytics error:', e);
      }
    }, 10000); // Record view after 10 seconds
    return () => clearTimeout(timer);
  }, [chapter, auth.currentUser]);

  const toggleLike = async () => {
    if (!auth.currentUser) {
      document.getElementById('login-btn')?.click();
      return;
    }
    if (!chapter) return;

    try {
      if (hasLiked) {
        const q = query(
          collection(db, 'interactions'),
          where('userId', '==', auth.currentUser.uid),
          where('targetId', '==', chapter.id),
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
          targetId: chapter.id,
          targetType: 'chapter',
          type: 'like',
          createdAt: serverTimestamp(),
        });
        setHasLiked(true);
      }
    } catch (e) {
      console.error('Error toggling like:', e);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: chapter?.title,
        text: `Check out this chapter: ${chapter?.title}`,
        url: window.location.href,
      });
    }
  };

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: 1, behavior: 'auto' });
        
        // Auto-advance logic if at bottom
        if (autoAdvance && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
          goToNext();
        }
      }, 50 / autoScrollSpeed);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScrollSpeed, autoAdvance]);

  useEffect(() => {
    const fetchChapter = async () => {
      if (!novelId || !chapterNumber) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'novels', novelId, 'chapters'), 
          where('chapterNumber', '==', parseInt(chapterNumber)),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const ch = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Chapter;
          setChapter(ch);
          
          if (auth.currentUser) {
            const progressRef = doc(db, 'users', auth.currentUser.uid, 'progress', novelId);
            await setDoc(progressRef, {
              novelId,
              lastChapterId: ch.id,
              lastChapterNumber: ch.chapterNumber,
              lastReadAt: serverTimestamp()
            }, { merge: true });
          }
        } else {
          setChapter(null);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `novels/${novelId}/chapters`);
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    fetchChapter();
    stopAudio();
  }, [novelId, chapterNumber]);

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleAudio = () => {
    if (!synthRef.current || !translatedContent) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(translatedContent);
      
      // Try to find a voice matching the language
      const voices = synthRef.current.getVoices();
      const voice = voices.find(v => v.lang.startsWith(language.code)) || voices[0];
      if (voice) utterance.voice = voice;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const goToNext = () => {
    if (!chapter) return;
    navigate(`/read/${novelId}/${chapter.chapterNumber + 1}`);
  };

  const goToPrev = () => {
    if (!chapter || chapter.chapterNumber <= 1) return;
    navigate(`/read/${novelId}/${chapter.chapterNumber - 1}`);
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <div className="h-2 w-32 animate-pulse bg-indigo-600 rounded-full" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Loading Chapter</p>
    </div>
  );

  if (!chapter) return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-6 text-center">
      <h2 className="font-serif text-4xl font-bold">The End.</h2>
      <p className="text-zinc-500">You've reached the end of the current adventure.</p>
      <Link to={`/novel/${novelId}`} className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-700">
        Return to Library
      </Link>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen transition-all duration-700",
      theme === 'dark' ? "bg-zinc-950 text-zinc-300" : 
      theme === 'sepia' ? "bg-[#f4ecd8] text-[#5b4636]" : 
      "bg-[#fdfbf6] text-zinc-900"
    )}>
      {/* Top Navigation */}
      <nav className={cn(
        "sticky top-0 z-40 w-full border-b px-4 py-4 backdrop-blur-xl transition-all duration-500",
        theme === 'dark' ? "border-zinc-800/50 bg-zinc-950/90" : 
        theme === 'sepia' ? "border-[#e0d6bc] bg-[#f4ecd8]/90" : 
        "border-zinc-200/50 bg-[#fdfbf6]/90"
      )}>
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to={`/novel/${novelId}`} className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-indigo-600">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden text-[10px] font-bold uppercase tracking-widest md:block">Exit</span>
          </Link>
          
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-600">Chapter {chapter.chapterNumber}</p>
            <h1 className="line-clamp-1 max-w-[200px] font-serif text-lg font-bold md:max-w-xs">
              {titleLoading ? <span className="animate-pulse opacity-50">...</span> : translatedTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleAudio}
              className={cn(
                "rounded-full p-2.5 transition-all",
                isSpeaking ? "bg-indigo-600 text-white animate-pulse" : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              )}
            >
              {isSpeaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full bg-zinc-100 p-2.5 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Chapter Content */}
      <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Atmospheric Media */}
        <AnimatePresence>
          {chapter.mediaUrls && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-16 space-y-8"
            >
              {chapter.mediaUrls.image && (
                <div className="overflow-hidden rounded-[2.5rem] shadow-2xl ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                  <img src={chapter.mediaUrls.image} className="w-full object-cover" alt="Atmospheric Narrative" referrerPolicy="no-referrer" />
                </div>
              )}
              
              {chapter.mediaUrls.video && (
                <div className="aspect-video overflow-hidden rounded-[2.5rem] bg-black shadow-2xl">
                  {chapter.mediaUrls.video.includes('youtube.com') || chapter.mediaUrls.video.includes('youtu.be') ? (
                    <iframe 
                      src={chapter.mediaUrls.video.replace('watch?v=', 'embed/').split('&')[0]}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={chapter.mediaUrls.video} controls className="h-full w-full" />
                  )}
                </div>
              )}

              {chapter.mediaUrls.audio && (
                <div className="flex items-center gap-6 rounded-[2rem] bg-indigo-50/50 p-6 backdrop-blur-md dark:bg-indigo-950/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white animate-pulse">
                    <Music className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">Chapter Soundtrack</p>
                    <audio controls src={chapter.mediaUrls.audio} className="h-8 w-full opacity-70 transition-opacity hover:opacity-100" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className={cn(
            "mx-auto prose",
            theme === 'dark' ? "prose-invert" : "",
            fontFamily === 'serif' ? "font-serif" : "font-sans"
          )}
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: lineHeight,
            color: theme === 'sepia' ? '#5b4636' : undefined
          }}
        >
          {contentLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI Translation in progress...</p>
            </div>
          )}
          
          {!contentLoading && (
            <div className="space-y-12">
              <div className="markdown-content">
                <ReactMarkdown>{translatedContent}</ReactMarkdown>
              </div>
              
              {isBilingual && language.code !== 'en' && (
                <div className="mt-16 space-y-8 border-t border-zinc-100 pt-16 dark:border-zinc-800">
                  <div className="flex items-center gap-3 opacity-30">
                    <div className="h-px w-8 bg-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Original Reference</span>
                  </div>
                  <div className="font-sans text-sm italic text-zinc-400 dark:text-zinc-500 opacity-60 leading-relaxed">
                    <ReactMarkdown>{chapter.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-20 space-y-20">
          {/* Interaction Bar */}
          <div className="flex items-center justify-center gap-12 py-8 border-y border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={toggleLike}
              className={cn(
                "flex flex-col items-center gap-2 transition-all hover:scale-110",
                hasLiked ? "text-rose-500" : "text-zinc-400"
              )}
            >
              <Heart className={cn("h-6 w-6", hasLiked && "fill-current")} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Enchanting</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-2 text-zinc-400 transition-all hover:scale-110 hover:text-indigo-600"
            >
              <Share2 className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Echo</span>
            </button>

            <button 
              onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-2 text-zinc-400 transition-all hover:scale-110 hover:text-indigo-600"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Reflect</span>
            </button>
          </div>

          <div id="comments-section">
            <CommentsSection novelId={novelId!} chapterId={chapter.id} />
          </div>

          <div className="flex w-full items-center justify-between pb-12">
            <button 
              onClick={goToPrev}
              disabled={chapter.chapterNumber <= 1}
              className="group flex items-center gap-3 rounded-full border border-zinc-200 px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-20 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Preceding
            </button>
            
            <button 
              onClick={goToNext}
              className="group flex items-center gap-3 rounded-full bg-indigo-600 px-10 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20"
            >
              Succeeding
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-8"
          >
            <div className="mx-auto max-w-md rounded-[2rem] bg-white/90 p-8 shadow-2xl ring-1 ring-zinc-200/50 backdrop-blur-2xl dark:bg-zinc-950/90 dark:ring-zinc-800/50">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Reading Parameters</h3>
                <button onClick={() => setShowSettings(false)} className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-100">&times;</button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span className="flex items-center gap-2">
                       <Type className="h-3 w-3" />
                       Typography & Scale
                    </span>
                    <span>{fontSize}px / {lineHeight}x</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setFontSize(Math.max(14, fontSize - 1))} className="flex-1 rounded-xl bg-zinc-100 py-3 font-bold transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">-</button>
                      <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="flex-1 rounded-xl bg-zinc-100 py-3 font-bold transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">+</button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))} className="flex-1 rounded-xl bg-zinc-100 py-3 text-[10px] font-bold transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">Tight</button>
                      <button onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.2))} className="flex-1 rounded-xl bg-zinc-100 py-3 text-[10px] font-bold transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">Loose</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setFontFamily('serif')}
                      className={cn(
                        "rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                        fontFamily === 'serif' ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-900"
                      )}
                    >
                      Classic Serif
                    </button>
                    <button 
                      onClick={() => setFontFamily('sans')}
                      className={cn(
                        "rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                        fontFamily === 'sans' ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-900"
                      )}
                    >
                      Modern Sans
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Aesthetic Palette</div>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl py-4 text-[9px] font-bold uppercase tracking-widest transition-all",
                        theme === 'light' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "bg-zinc-100 dark:bg-zinc-900"
                      )}
                    >
                      <Sun className="h-3 w-3" />
                      Day
                    </button>
                    <button 
                      onClick={() => setTheme('sepia')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl py-4 text-[9px] font-bold uppercase tracking-widest transition-all",
                        theme === 'sepia' ? "bg-[#e5d9b6] text-zinc-900 ring-2 ring-indigo-600" : "bg-[#f4ecd8] text-[#5b4636]"
                      )}
                    >
                      <span className="h-3 w-3 rounded-full bg-[#5b4636]" />
                      Sepia
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl py-4 text-[9px] font-bold uppercase tracking-widest transition-all",
                        theme === 'dark' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "bg-zinc-900 text-white"
                      )}
                    >
                      <Moon className="h-3 w-3" />
                      Night
                    </button>
                  </div>
                </div>

                {/* Additional Intelligence Features */}
                <div className="space-y-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Auto-Scroll</p>
                      <p className="text-[9px] text-zinc-400">Autonomous page progression</p>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setAutoScrollSpeed(speed)}
                          className={cn(
                            "h-8 w-8 rounded-lg text-[10px] font-bold transition-all",
                            autoScrollSpeed === speed 
                              ? "bg-indigo-600 text-white" 
                              : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                          )}
                        >
                          {speed === 0 ? 'Off' : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Bilingual Focus</p>
                      <p className="text-[9px] text-zinc-400">Show English original text</p>
                    </div>
                    <button
                      onClick={() => setIsBilingual(!isBilingual)}
                      className={cn(
                        "h-6 w-11 rounded-full transition-colors relative",
                        isBilingual ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                        isBilingual ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Auto-Advance</p>
                      <p className="text-[9px] text-zinc-400">Next chapter automatically</p>
                    </div>
                    <button
                      onClick={() => setAutoAdvance(!autoAdvance)}
                      className={cn(
                        "h-6 w-11 rounded-full transition-colors relative",
                        autoAdvance ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                        autoAdvance ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

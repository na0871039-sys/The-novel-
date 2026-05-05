import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Category } from '../types';
import { Upload, Book, FileText, Sparkles, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Image as ImageIcon, Video, Music, Info, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES: Category[] = ['Love', 'Horror', 'Mystery', 'Adventure', 'Emotional', 'Motivational', 'Drama'];

export default function UploadNovelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedId, setUploadedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: user?.displayName || '',
    category: 'Adventure' as Category,
    coverUrl: '',
    initialChapterTitle: '',
    initialChapterContent: '',
    mediaImage: '',
    mediaVideo: '',
    mediaAudio: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePublish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create the Novel
      const novelDoc = await addDoc(collection(db, 'novels'), {
        title: formData.title,
        description: formData.description,
        author: formData.author,
        category: formData.category,
        coverUrl: formData.coverUrl || 'https://images.unsplash.com/photo-1543005124-8198f5ac6d7b?q=80&w=2787&auto=format&fit=crop',
        chapterCount: 1,
        readerCount: 0,
        popularityScore: 0,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 2. Create the first Chapter
      await addDoc(collection(db, 'novels', novelDoc.id, 'chapters'), {
        chapterNumber: 1,
        title: formData.initialChapterTitle || 'Chapter One',
        content: formData.initialChapterContent,
        mediaUrls: {
          image: formData.mediaImage,
          video: formData.mediaVideo,
          audio: formData.mediaAudio,
        },
        createdAt: serverTimestamp(),
        novelId: novelDoc.id
      });

      setUploadedId(novelDoc.id);
      setStep(3);
    } catch (error) {
      console.error('Error publishing story:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="font-serif text-3xl font-bold mb-4">The Librarian Awaits.</h2>
        <p className="text-zinc-500 max-w-sm mb-8">Please sign in to your accounts to contribute to our global collection.</p>
        <button onClick={() => navigate('/login')} className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white">Sign In</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 px-4">
      {/* Progress Header */}
      <div className="mb-20">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className={cn("h-2 w-12 rounded-full transition-all", step >= 1 ? "bg-indigo-600" : "bg-zinc-200")} />
          <div className={cn("h-2 w-12 rounded-full transition-all", step >= 2 ? "bg-indigo-600" : "bg-zinc-200")} />
          <div className={cn("h-2 w-12 rounded-full transition-all", step >= 3 ? "bg-indigo-600" : "bg-zinc-200")} />
        </div>
        <h1 className="text-center font-serif text-4xl md:text-5xl font-bold">Publish Your <span className="italic text-indigo-600">Story.</span></h1>
        <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Join our global network of infinite narratives</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Novel Title</label>
                  <div className="relative">
                    <Book className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Whispers of the Silk Road"
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category / Genre</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cover Image URL</label>
                  <input
                    name="coverUrl"
                    value={formData.coverUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                  <p className="text-[9px] text-zinc-400">Leave blank for a professional placeholder</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Synopsis</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="The essence of your journey..."
                  className="w-full rounded-3xl border border-zinc-200 bg-white p-6 text-sm font-medium leading-relaxed outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={!formData.title || !formData.description}
                onClick={() => setStep(2)}
                className="group flex items-center gap-3 rounded-full bg-zinc-900 px-10 py-5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-600 disabled:opacity-30 dark:bg-white dark:text-zinc-950"
              >
                Next Step
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                   <FileText className="h-5 w-5" />
                 </div>
                 <h2 className="font-serif text-3xl font-bold">The First Installment</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Chapter Title</label>
                  <input
                    name="initialChapterTitle"
                    value={formData.initialChapterTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Awakening"
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    Content
                    <Type className="h-3 w-3" />
                  </label>
                  <p className="text-[9px] text-zinc-400 mb-2 italic">Markdown supported for rich styling (e.g., **bold**, *italic*)</p>
                  <textarea
                    name="initialChapterContent"
                    value={formData.initialChapterContent}
                    onChange={handleInputChange}
                    rows={12}
                    placeholder="Ink your thoughts here..."
                    className="w-full rounded-[2.5rem] border border-zinc-200 bg-white p-8 text-sm font-serif leading-loose outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                {/* Atmospheric Media Section */}
                <div className="pt-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Atmospheric Media</h3>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <ImageIcon className="h-3 w-3" />
                        Illustration URL
                      </label>
                      <input
                        name="mediaImage"
                        value={formData.mediaImage}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Video className="h-3 w-3" />
                        Video Embed/URL
                      </label>
                      <input
                        name="mediaVideo"
                        value={formData.mediaVideo}
                        onChange={handleInputChange}
                        placeholder="Youtube link..."
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Music className="h-3 w-3" />
                        Ambient Audio URL
                      </label>
                      <input
                        name="mediaAudio"
                        value={formData.mediaAudio}
                        onChange={handleInputChange}
                        placeholder="Audio direct link..."
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-800 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                    <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      Media URLs will be rendered directly in the reader to enhance the atmosphere of your story. Ensure links are publicly accessible.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="group flex items-center gap-3 rounded-full border border-zinc-200 px-8 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back
              </button>

              <button
                disabled={loading || !formData.initialChapterContent}
                onClick={handlePublish}
                className="group flex items-center gap-4 rounded-full bg-indigo-600 px-12 py-5 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Publish Story
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="mb-8 rounded-full bg-green-50 p-6 text-green-600 dark:bg-green-950/40">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <h2 className="font-serif text-5xl font-bold">Eternity Awaits.</h2>
            <p className="mt-6 text-lg text-zinc-500 max-w-lg">
              Your story has been inscribed into our global library. Readers across the world 
              can now discover and translate your perspective.
            </p>
            <div className="mt-12 flex gap-4">
              <button
                onClick={() => navigate(`/novel/${uploadedId}`)}
                className="rounded-full bg-indigo-600 px-10 py-5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20"
              >
                View Your Story
              </button>
              <button
                onClick={() => navigate('/')}
                className="rounded-full border border-zinc-200 px-10 py-5 text-xs font-bold uppercase tracking-widest text-zinc-900 dark:border-zinc-800 dark:text-white"
              >
                Library Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

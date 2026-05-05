import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Novel, Category } from '../types';
import { Plus, Edit2, Trash2, BookOpen, Users, BarChart3, ChevronRight, X, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORIES: Category[] = ['Love', 'Horror', 'Mystery', 'Adventure', 'Emotional', 'Motivational', 'Drama'];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-zinc-500">Manage your library and content.</p>
        </div>
      </div>

      <nav className="flex gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <Link to="/admin" className="text-sm font-bold uppercase tracking-widest text-indigo-600">Overview</Link>
        <Link to="/admin/new" className="text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-indigo-600">Add Novel</Link>
      </nav>

      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="new" element={<NovelForm />} />
        <Route path="edit/:id" element={<NovelForm editMode />} />
        <Route path="chapters/:id" element={<ChapterManager />} />
      </Routes>
    </div>
  );
}

function AdminOverview() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNovels = async () => {
      const q = query(collection(db, 'novels'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setNovels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel)));
      setLoading(false);
    };
    fetchNovels();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this novel?')) return;
    try {
      await deleteDoc(doc(db, 'novels', id));
      setNovels(novels.filter(n => n.id !== id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `novels/${id}`);
    }
  };

  const stats = [
    { label: 'Total Novels', value: novels.length, icon: BookOpen, color: 'text-blue-600' },
    { label: 'Total Readers', value: novels.reduce((acc, n) => acc + (n.readerCount || 0), 0), icon: Users, color: 'text-indigo-600' },
    { label: 'Featured List', value: '7 Categories', icon: BarChart3, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={cn("rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-bold">Manage Content</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-4">Novel</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {novels.map(novel => (
                <tr key={novel.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={novel.coverUrl} className="h-12 w-9 rounded object-cover" />
                      <div>
                        <p className="font-bold">{novel.title}</p>
                        <p className="text-xs text-zinc-500">{novel.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {novel.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Link 
                        to={`/admin/chapters/${novel.id}`}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Manage Chapters"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Link>
                      <Link 
                        to={`/admin/edit/${novel.id}`}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(novel.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NovelForm({ editMode }: { editMode?: boolean }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    coverUrl: '',
    category: 'Drama' as Category,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editMode ? window.location.pathname.split('/').pop() : Math.random().toString(36).substr(2, 9);
    try {
       const novelData = {
        ...formData,
        chapterCount: 0,
        readerCount: 0,
        popularityScore: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'novels', id!), novelData, { merge: true });
      navigate('/admin');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `novels/${id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Title</label>
          <input 
            required 
            className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600 dark:border-zinc-800"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Author</label>
          <input 
            required 
            className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600 dark:border-zinc-800"
            value={formData.author}
            onChange={e => setFormData({ ...formData, author: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Category</label>
        <select 
          className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600 dark:border-zinc-800"
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Cover Image URL</label>
        <input 
          required 
          placeholder="https://images.unsplash.com/..."
          className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600 dark:border-zinc-800"
          value={formData.coverUrl}
          onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500">Description</label>
        <textarea 
          required 
          rows={5}
          className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-600 dark:border-zinc-800"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button type="submit" className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]">
        {editMode ? 'Update Novel' : 'Publish Novel'}
      </button>
    </form>
  );
}

function ChapterManager() {
  const navigate = useNavigate();
  const id = window.location.pathname.split('/').pop()!;
  const [chapters, setChapters] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({ title: '', content: '', chapterNumber: 1 });

  const fetchChapters = async () => {
    const q = query(collection(db, 'novels', id, 'chapters'), orderBy('chapterNumber', 'asc'));
    const snapshot = await getDocs(q);
    setChapters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchChapters();
  }, [id]);

  const handleSaveChapter = async () => {
    const chapterId = `ch-${chapterForm.chapterNumber}`;
    try {
      await setDoc(doc(db, 'novels', id, 'chapters', chapterId), {
        ...chapterForm,
        novelId: id,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      fetchChapters();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `novels/${id}/chapters`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Manage Chapters</h2>
        <button 
          onClick={() => {
            setChapterForm({ title: '', content: '', chapterNumber: chapters.length + 1 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Chapter
        </button>
      </div>

      <div className="grid gap-4">
        {chapters.map(ch => (
          <div key={ch.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Chapter {ch.chapterNumber}</p>
              <h3 className="font-bold">{ch.title}</h3>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Edit2 className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl space-y-4 rounded-3xl bg-white p-8 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">New Chapter</h3>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
               <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Chapter Number</label>
                <input 
                  type="number"
                  className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 outline-none dark:border-zinc-800"
                  value={chapterForm.chapterNumber}
                  onChange={e => setChapterForm({ ...chapterForm, chapterNumber: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Title</label>
                <input 
                  className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 outline-none dark:border-zinc-800"
                  value={chapterForm.title}
                  onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Content</label>
              <textarea 
                rows={10}
                className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-2 outline-none dark:border-zinc-800"
                value={chapterForm.content}
                onChange={e => setChapterForm({ ...chapterForm, content: e.target.value })}
              />
            </div>
            <button 
              onClick={handleSaveChapter}
              className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-700"
            >
              Save Chapter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

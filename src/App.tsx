import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import NovelDetailsPage from './pages/NovelDetailsPage';
import ReaderPage from './pages/ReaderPage';
import AdminPage from './pages/AdminPage';
import BookmarksPage from './pages/BookmarksPage';
import UploadNovelPage from './pages/UploadNovelPage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
import LoginPage from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fafaf8] text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar />
        <main className="pb-20 pt-4 px-4 md:px-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/novel/:id" element={<NovelDetailsPage />} />
            <Route path="/read/:novelId/:chapterNumber" element={<ReaderPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/upload" element={<UploadNovelPage />} />
            <Route path="/dashboard" element={<CreatorDashboardPage />} />
            <Route 
              path="/admin/*" 
              element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

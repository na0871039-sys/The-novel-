import { Link, useLocation } from 'react-router-dom';
import { Home, Bookmark, ShieldCheck, LogOut, Search, User, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Library', path: '/', icon: Home },
    { label: 'Saved', path: '/bookmarks', icon: Bookmark },
    { label: 'Publish', path: '/upload', icon: ShieldCheck },
  ];

  if (user) {
    navItems.push({ label: 'Insights', path: '/dashboard', icon: BarChart3 });
  }

  if (user?.isAdmin) {
    navItems.push({ label: 'System', path: '/admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight">
            Global Novel <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Library</span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:text-indigo-600",
                    location.pathname === item.path ? "text-indigo-600" : "text-zinc-500"
                  )}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600" />
                  )}
                </Link>
              ))}
            </div>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-4">
              <LanguageSelector />
              {user ? (
                <button
                  onClick={logout}
                  className="rounded-full bg-zinc-100 p-2 text-zinc-600 transition-all hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={login}
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 text-[9px] uppercase tracking-[0.15em] font-bold transition-colors",
                location.pathname === item.path ? "text-indigo-600" : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          
          <div className="flex flex-col items-center gap-1">
             <LanguageSelector />
             <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400">Lang</span>
          </div>

          <button
            onClick={user ? logout : login}
            className="flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400"
          >
            {user ? <LogOut className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {user ? 'Exit' : 'Login'}
          </button>
        </div>
      </nav>
      
      <div className="hidden h-16 md:block" />
    </>
  );
}

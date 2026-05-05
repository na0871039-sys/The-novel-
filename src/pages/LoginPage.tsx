import { useAuth } from '../hooks/useAuth';
import { BookOpen, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="flex justify-center">
          <div className="rounded-2xl bg-indigo-600 p-4 shadow-xl shadow-indigo-500/20">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold tracking-tight">MyNovel Library</h1>
          <p className="mt-3 text-zinc-400">
            Immerse yourself in a world of emotional, engaging, and unforgettable stories.
          </p>
        </div>

        <button
          onClick={login}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-lg font-semibold text-zinc-950 transition-all hover:bg-zinc-200 active:scale-95"
        >
          <LogIn className="h-5 w-5" />
          Continue with Google
        </button>

        <p className="text-xs text-zinc-500">
          By signing in, you agree to our terms and conditions.
        </p>
      </motion.div>
    </div>
  );
}

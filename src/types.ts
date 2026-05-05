import { Timestamp } from 'firebase/firestore';

export type Category = 'Love' | 'Horror' | 'Mystery' | 'Adventure' | 'Emotional' | 'Motivational' | 'Drama';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
  createdAt: Timestamp;
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  author: string;
  coverUrl: string;
  category: Category;
  chapterCount: number;
  readerCount: number;
  likesCount?: number;
  commentsCount?: number;
  popularityScore: number;
  creatorId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
  likesCount?: number;
  commentsCount?: number;
  mediaUrls?: {
    image?: string;
    video?: string;
    audio?: string;
  };
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: Timestamp;
  novelId: string;
  chapterId?: string;
}

export interface Interaction {
  id: string;
  userId: string;
  type: 'like' | 'view';
  targetId: string; // Novel ID or Chapter ID
  targetType: 'novel' | 'chapter';
  createdAt: Timestamp;
}

export interface Bookmark {
  id: string;
  novelId: string;
  novelTitle: string;
  coverUrl: string;
  addedAt: Timestamp;
}

export interface ReadingProgress {
  novelId: string;
  lastChapterNumber: number;
  lastReadAt: Timestamp;
}

export interface AppState {
  user: UserProfile | null;
  loading: boolean;
}

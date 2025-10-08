export interface User {
  id: string;
  email: string;
  displayName: string;
  familyId: string;
  role: 'admin' | 'member';
  quiz_score?: number;
  quiz_streak?: number;
  createdAt: Date;
}

export interface Family {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
  createdAt: Date;
}

export interface Media {
  id: string;
  familyId: string;
  type: 'photo' | 'audio';
  title: string;
  description?: string;
  url: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
}

export interface Post {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'announcement' | 'discussion' | 'prayer-request';
  createdAt: Date;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  familyId: string;
  title: string;
  message: string;
  type: 'announcement' | 'media' | 'general' | 'quiz';
  isRead: boolean;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  bibleReference: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  familyId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  createdAt: Date;
}
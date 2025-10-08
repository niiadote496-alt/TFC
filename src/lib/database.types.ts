export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string | null
          member_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          image_url?: string | null
          member_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string | null
          member_count?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          family_id: string | null
          role: 'admin' | 'member'
          quiz_score: number
          quiz_streak: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          family_id?: string | null
          role?: 'admin' | 'member'
          quiz_score?: number
          quiz_streak?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          family_id?: string | null
          role?: 'admin' | 'member'
          quiz_score?: number
          quiz_streak?: number
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          family_id: string
          author_id: string
          author_name: string
          content: string
          type: 'announcement' | 'discussion' | 'prayer-request'
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          author_id: string
          author_name: string
          content: string
          type?: 'announcement' | 'discussion' | 'prayer-request'
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          author_id?: string
          author_name?: string
          content?: string
          type?: 'announcement' | 'discussion' | 'prayer-request'
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          author_name: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          author_name: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          family_id: string
          type: 'photo' | 'audio'
          title: string
          description: string | null
          url: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          family_id: string
          type: 'photo' | 'audio'
          title: string
          description?: string | null
          url: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          type?: 'photo' | 'audio'
          title?: string
          description?: string | null
          url?: string
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          family_id: string
          user_id: string | null
          title: string
          message: string
          type: 'announcement' | 'media' | 'general' | 'quiz'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id?: string | null
          title: string
          message: string
          type?: 'announcement' | 'media' | 'general' | 'quiz'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: 'announcement' | 'media' | 'general' | 'quiz'
          is_read?: boolean
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          question: string
          correct_answer: string
          options: Json
          difficulty: 'easy' | 'medium' | 'hard'
          bible_reference: string
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          correct_answer: string
          options: Json
          difficulty?: 'easy' | 'medium' | 'hard'
          bible_reference: string
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          correct_answer?: string
          options?: Json
          difficulty?: 'easy' | 'medium' | 'hard'
          bible_reference?: string
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          family_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          points_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          family_id: string
          question_id: string
          user_answer: string
          is_correct: boolean
          points_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string
          question_id?: string
          user_answer?: string
          is_correct?: boolean
          points_earned?: number
          created_at?: string
        }
      }
    }
  }
}

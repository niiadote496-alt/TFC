import { supabase } from './supabase';
import type { User, Family, Media, Post, Notification, QuizQuestion, QuizAttempt } from '../types';

export async function createUserProfile(userId: string, userData: Omit<User, 'id' | 'createdAt'>) {
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userData.email,
      display_name: userData.displayName,
      family_id: userData.familyId || null,
      role: userData.role,
      quiz_score: 0,
      quiz_streak: 0,
    });

  if (error) throw error;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    familyId: data.family_id || '',
    role: data.role,
    createdAt: new Date(data.created_at),
  };
}

export async function updateUserFamily(userId: string, familyId: string) {
  const { error } = await supabase
    .from('users')
    .update({ family_id: familyId })
    .eq('id', userId);

  if (error) throw error;

  const { error: familyError } = await supabase.rpc('increment_family_members', { family_id: familyId });
  if (familyError) console.error('Error updating family count:', familyError);
}

export async function getFamilies(): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(family => ({
    id: family.id,
    name: family.name,
    description: family.description,
    imageUrl: family.image_url || undefined,
    memberCount: family.member_count,
    createdAt: new Date(family.created_at),
  }));
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url || undefined,
    memberCount: data.member_count,
    createdAt: new Date(data.created_at),
  };
}

export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      family_id: postData.familyId,
      author_id: postData.authorId,
      author_name: postData.authorName,
      content: postData.content,
      type: postData.type,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    familyId: data.family_id,
    authorId: data.author_id,
    authorName: data.author_name,
    content: data.content,
    type: data.type,
    createdAt: new Date(data.created_at),
    likes: [],
    comments: [],
  };
}

export async function getFamilyPosts(familyId: string): Promise<Post[]> {
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_likes(user_id),
      comments(*)
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return posts.map(post => ({
    id: post.id,
    familyId: post.family_id,
    authorId: post.author_id,
    authorName: post.author_name,
    content: post.content,
    type: post.type,
    createdAt: new Date(post.created_at),
    likes: (post.post_likes || []).map((like: any) => like.user_id),
    comments: (post.comments || []).map((comment: any) => ({
      id: comment.id,
      authorId: comment.author_id,
      authorName: comment.author_name,
      content: comment.content,
      createdAt: new Date(comment.created_at),
    })),
  }));
}

export async function togglePostLike(postId: string, userId: string): Promise<void> {
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingLike) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function addComment(postId: string, authorId: string, authorName: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      author_name: authorName,
      content,
    });

  if (error) throw error;
}

export async function getFamilyMedia(familyId: string): Promise<Media[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('family_id', familyId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  return data.map(media => ({
    id: media.id,
    familyId: media.family_id,
    type: media.type,
    title: media.title,
    description: media.description || undefined,
    url: media.url,
    downloadUrl: media.url,
    uploadedBy: media.uploaded_by,
    uploadedAt: new Date(media.uploaded_at),
  }));
}

export async function uploadMedia(
  familyId: string,
  userId: string,
  file: File,
  title: string,
  description?: string
): Promise<Media> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${familyId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  const type = file.type.startsWith('image/') ? 'photo' : 'audio';

  const { data, error } = await supabase
    .from('media')
    .insert({
      family_id: familyId,
      type,
      title,
      description: description || null,
      url: urlData.publicUrl,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    familyId: data.family_id,
    type: data.type,
    title: data.title,
    description: data.description || undefined,
    url: data.url,
    downloadUrl: data.url,
    uploadedBy: data.uploaded_by,
    uploadedAt: new Date(data.uploaded_at),
  };
}

export async function getFamilyNotifications(familyId: string, userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;

  return data.map(notification => ({
    id: notification.id,
    familyId: notification.family_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.is_read,
    createdAt: new Date(notification.created_at),
  }));
}

export async function createNotification(familyId: string, title: string, message: string, type: Notification['type']): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      family_id: familyId,
      title,
      message,
      type,
    });

  if (error) throw error;
}

export async function getRandomQuizQuestion(): Promise<QuizQuestion | null> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .limit(50);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const randomQuestion = data[Math.floor(Math.random() * data.length)];

  return {
    id: randomQuestion.id,
    question: randomQuestion.question,
    correctAnswer: randomQuestion.correct_answer,
    options: randomQuestion.options as string[],
    difficulty: randomQuestion.difficulty,
    bibleReference: randomQuestion.bible_reference,
  };
}

export async function submitQuizAnswer(
  userId: string,
  familyId: string,
  questionId: string,
  userAnswer: string,
  isCorrect: boolean,
  pointsEarned: number
): Promise<void> {
  const { error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      family_id: familyId,
      question_id: questionId,
      user_answer: userAnswer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });

  if (error) throw error;

  if (isCorrect) {
    const { data: userData } = await supabase
      .from('users')
      .select('quiz_score, quiz_streak')
      .eq('id', userId)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({
          quiz_score: userData.quiz_score + pointsEarned,
          quiz_streak: userData.quiz_streak + 1,
        })
        .eq('id', userId);
    }
  } else {
    await supabase
      .from('users')
      .update({ quiz_streak: 0 })
      .eq('id', userId);
  }
}

export async function getFamilyLeaderboard(familyId: string): Promise<Array<{ id: string; displayName: string; quizScore: number; quizStreak: number }>> {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, quiz_score, quiz_streak')
    .eq('family_id', familyId)
    .order('quiz_score', { ascending: false })
    .limit(10);

  if (error) throw error;

  return data.map(user => ({
    id: user.id,
    displayName: user.display_name,
    quizScore: user.quiz_score,
    quizStreak: user.quiz_streak,
  }));
}

export async function getUsersByFamily(familyId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('family_id', familyId);

  if (error) throw error;

  return data.map(user => ({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    familyId: user.family_id || '',
    role: user.role,
    createdAt: new Date(user.created_at),
  }));
}

export async function promoteToAdmin(userId: string, familyId: string): Promise<void> {
  const admins = await getUsersByFamily(familyId);
  const adminCount = admins.filter(u => u.role === 'admin').length;

  if (adminCount >= 2) {
    throw new Error('Family already has maximum number of admins (2)');
  }

  const { error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (error) throw error;
}

export function subscribeToUserProfile(userId: string, callback: (user: User | null) => void) {
  const channel = supabase
    .channel(`user:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` }, async () => {
      const user = await getUserProfile(userId);
      callback(user);
    })
    .subscribe();

  getUserProfile(userId).then(callback).catch((error) => {
    console.error('Error loading user profile:', error);
    callback(null);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToFamilyPosts(familyId: string, callback: (posts: Post[]) => void) {
  const channel = supabase
    .channel(`posts:${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `family_id=eq.${familyId}` }, async () => {
      const posts = await getFamilyPosts(familyId);
      callback(posts);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, async () => {
      const posts = await getFamilyPosts(familyId);
      callback(posts);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, async () => {
      const posts = await getFamilyPosts(familyId);
      callback(posts);
    })
    .subscribe();

  getFamilyPosts(familyId).then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToFamilyNotifications(familyId: string, userId: string, callback: (notifications: Notification[]) => void) {
  const channel = supabase
    .channel(`notifications:${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `family_id=eq.${familyId}` }, async () => {
      const notifications = await getFamilyNotifications(familyId, userId);
      callback(notifications);
    })
    .subscribe();

  getFamilyNotifications(familyId, userId).then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
}

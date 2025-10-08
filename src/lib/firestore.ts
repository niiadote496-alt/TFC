import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { User, Family, Media, Post, Notification } from '../types';

// Users Collection
export const createUserProfile = async (userId: string, userData: Omit<User, 'id' | 'createdAt'>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    id: userId,
    ...userData,
    createdAt: serverTimestamp()
  }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as User;
  }
  return null;
};

export const updateUserFamily = async (userId: string, familyId: string) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { familyId }, { merge: true });
  
  // Update family member count
  const familyRef = doc(db, 'families', familyId);
  await updateDoc(familyRef, {
    memberCount: increment(1)
  });
};

export const getUsersByFamily = async (familyId: string): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('familyId', '==', familyId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as User[];
};

export const getFamilyAdmins = async (familyId: string): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef, 
    where('familyId', '==', familyId),
    where('role', '==', 'admin')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as User[];
};

export const promoteToAdmin = async (userId: string, familyId: string): Promise<boolean> => {
  // Check if family already has 2 admins
  const admins = await getFamilyAdmins(familyId);
  if (admins.length >= 2) {
    throw new Error('Family already has maximum number of admins (2)');
  }
  
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: 'admin' });
  return true;
};

// Families Collection
export const getFamilies = async (): Promise<Family[]> => {
  const familiesRef = collection(db, 'families');
  const querySnapshot = await getDocs(familiesRef);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as Family[];
};

export const getFamily = async (familyId: string): Promise<Family | null> => {
  const familyRef = doc(db, 'families', familyId);
  const familySnap = await getDoc(familyRef);
  
  if (familySnap.exists()) {
    const data = familySnap.data();
    return {
      id: familySnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as Family;
  }
  return null;
};

// Media Collection
export const uploadMedia = async (
  file: File, 
  familyId: string, 
  userId: string, 
  title: string, 
  description?: string,
  tags?: string[]
): Promise<Media> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
  const mediaType = file.type.startsWith('image/') ? 'photo' : 'audio';
  const storagePath = `families/${familyId}/${mediaType}s/${fileName}`;
  
  // Upload file to Firebase Storage
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Create media document in Firestore
  const mediaData = {
    familyId,
    type: mediaType as 'photo' | 'audio',
    title,
    description: description || '',
    url: downloadURL,
    downloadUrl: downloadURL,
    uploadedBy: userId,
    uploadedAt: serverTimestamp(),
    tags: tags || [],
    storagePath
  };
  
  const mediaRef = await addDoc(collection(db, 'media'), mediaData);
  
  return {
    id: mediaRef.id,
    ...mediaData,
    type: mediaType as 'photo' | 'audio',
    uploadedAt: new Date()
  } as Media;
};

export const getFamilyMedia = async (familyId: string, type?: 'photo' | 'audio'): Promise<Media[]> => {
  const mediaRef = collection(db, 'media');
  let q = query(
    mediaRef, 
    where('familyId', '==', familyId)
  );
  
  if (type) {
    q = query(
      mediaRef,
      where('familyId', '==', familyId),
      where('type', '==', type)
    );
  }
  
  const querySnapshot = await getDocs(q);
  
  const media = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
  })) as Media[];
  
  // Sort by uploadedAt in JavaScript instead of Firestore
  return media.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
};

export const deleteMedia = async (mediaId: string): Promise<void> => {
  const mediaRef = doc(db, 'media', mediaId);
  const mediaSnap = await getDoc(mediaRef);
  
  if (mediaSnap.exists()) {
    const mediaData = mediaSnap.data();
    
    // Delete file from Firebase Storage
    if (mediaData.storagePath) {
      const storageRef = ref(storage, mediaData.storagePath);
      await deleteObject(storageRef);
    }
    
    // Delete document from Firestore
    await deleteDoc(mediaRef);
  }
};

// Posts Collection
export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<Post> => {
  const postRef = await addDoc(collection(db, 'posts'), {
    ...postData,
    createdAt: serverTimestamp(),
    likes: [],
    comments: []
  });
  
  return {
    id: postRef.id,
    ...postData,
    createdAt: new Date(),
    likes: [],
    comments: []
  };
};

export const getFamilyPosts = async (familyId: string): Promise<Post[]> => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('familyId', '==', familyId)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Post[];
    
    // Sort by createdAt in JavaScript and limit to 20
    return posts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  } catch (error) {
    console.error('Error fetching family posts:', error);
    return [];
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  const postRef = doc(db, 'posts', postId);
  const postSnap = await getDoc(postRef);
  
  if (postSnap.exists()) {
    const postData = postSnap.data();
    const likes = postData.likes || [];
    
    if (likes.includes(userId)) {
      // Unlike
      await updateDoc(postRef, {
        likes: likes.filter((id: string) => id !== userId)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likes: [...likes, userId]
      });
    }
  }
};

// Notifications Collection
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    createdAt: serverTimestamp()
  });
};

export const getFamilyNotifications = async (familyId: string): Promise<Notification[]> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('familyId', '==', familyId)
  );
  
  const querySnapshot = await getDocs(q);
  
  const notifications = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as Notification[];
  
  // Sort by createdAt in JavaScript and limit to 10
  return notifications
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { isRead: true });
};

// Real-time listeners
export const subscribeToFamilyPosts = (familyId: string, callback: (posts: Post[]) => void) => {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('familyId', '==', familyId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Post[];
    
    // Sort by createdAt in JavaScript and limit to 20
    const sortedPosts = posts
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
    callback(sortedPosts);
  });
};

export const subscribeToFamilyNotifications = (familyId: string, callback: (notifications: Notification[]) => void) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('familyId', '==', familyId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Notification[];
    
    // Sort by createdAt in JavaScript and limit to 10
    const sortedNotifications = notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    callback(sortedNotifications);
  });
};

export const subscribeToUserProfile = (userId: string, callback: (user: User | null) => void) => {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const user = {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as User;
      callback(user);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to user profile:', error);
    callback(null);
  });
};
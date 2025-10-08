import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const initializeFamilies = async () => {
  const families = [
    {
      id: 'doxa-portal',
      name: 'Doxa Portal Family',
      description: 'A community dedicated to worship and spiritual growth through divine revelation and praise.',
      imageUrl: 'https://images.pexels.com/photos/8468470/pexels-photo-8468470.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'rhema',
      name: 'Rhema Family',
      description: 'United by the spoken word of God, building faith through scripture and fellowship.',
      imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    },
    {
      id: 'glory',
      name: 'Glory Family',
      description: 'Reflecting God\'s glory in our daily lives and sharing His light with the world.',
      imageUrl: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800',
      memberCount: 0,
      createdAt: serverTimestamp()
    }
  ];

  try {
    for (const family of families) {
      const familyRef = doc(db, 'families', family.id);
      await setDoc(familyRef, family, { merge: true });
    }
    console.log('Families initialized successfully');
  } catch (error) {
    console.error('Error initializing families:', error);
  }
};
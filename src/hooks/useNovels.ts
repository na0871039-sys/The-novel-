import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Novel } from '../types';

export function useNovels() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNovels = async (filter?: { category?: string; search?: string }) => {
    setLoading(true);
    try {
      let q = query(collection(db, 'novels'), orderBy('createdAt', 'desc'));

      if (filter?.category) {
        q = query(collection(db, 'novels'), where('category', '==', filter.category), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        results = results.filter(n => 
          n.title.toLowerCase().includes(searchLower) || 
          n.author.toLowerCase().includes(searchLower)
        );
      }

      setNovels(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'novels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, []);

  return { novels, loading, fetchNovels };
}

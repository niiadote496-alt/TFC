import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Family } from '../types';
import { getFamilies } from '../lib/api';
import { Users, ArrowRight, Plus } from 'lucide-react';

export default function FamilySelection() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const { updateUserFamily, currentUser } = useAuth();

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const familiesData = await getFamilies();
        setFamilies(familiesData);
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, []);

  const handleJoinFamily = async () => {
    if (selectedFamily && currentUser) {
      await updateUserFamily(selectedFamily);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Family</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the family you belong to and connect with your community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {families.map((family) => (
            <div
              key={family.id}
              onClick={() => setSelectedFamily(family.id)}
              className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                selectedFamily === family.id
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-105 shadow-2xl'
                  : 'bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  selectedFamily === family.id
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700'
                }`}>
                  <Users className={`w-8 h-8 ${
                    selectedFamily === family.id ? 'text-white' : 'text-white'
                  }`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{family.name}</h3>
                <p className={`text-sm mb-4 ${
                  selectedFamily === family.id ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {family.description}
                </p>
                <div className={`flex items-center justify-center space-x-2 text-sm ${
                  selectedFamily === family.id ? 'text-white/90' : 'text-gray-500'
                }`}>
                  <Users className="w-4 h-4" />
                  <span>{family.memberCount} members</span>
                </div>
              </div>

              {selectedFamily === family.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleJoinFamily}
            disabled={!selectedFamily}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
          >
            <span>Join Family</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Don't see your family?</p>
          <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium space-x-2">
            <Plus className="w-4 h-4" />
            <span>Request New Family</span>
          </button>
        </div>
      </div>
    </div>
  );
}
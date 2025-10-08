import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Star, Book, CheckCircle, XCircle } from 'lucide-react';
import { getRandomQuizQuestion, submitQuizAnswer, getFamilyLeaderboard } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { QuizQuestion } from '../types';

interface BibleQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BibleQuiz({ isOpen, onClose }: BibleQuizProps) {
  const { userData } = useAuth();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; displayName: string; quizScore: number; quizStreak: number }>>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQuestion();
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const q = await getRandomQuizQuestion();
      setQuestion(q);
      setSelectedAnswer('');
      setShowResult(false);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!userData?.familyId) return;
    try {
      const data = await getFamilyLeaderboard(userData.familyId);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleSubmit = async () => {
    if (!question || !selectedAnswer || !userData) return;

    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    const pointsMap = { easy: 10, medium: 20, hard: 30 };
    const points = correct ? pointsMap[question.difficulty] : 0;

    try {
      await submitQuizAnswer(
        userData.id,
        userData.familyId,
        question.id,
        selectedAnswer,
        correct,
        points
      );
      await loadLeaderboard();
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    loadQuestion();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bible Quiz</h2>
            <p className="text-gray-600">Test your biblical knowledge</p>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors"
          >
            <Trophy className="w-5 h-5" />
            <span className="font-medium">Leaderboard</span>
          </button>
        </div>

        {userData && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">Total Score</span>
              </div>
              <p className="text-3xl font-bold">{userData.quiz_score || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <p className="text-3xl font-bold">{userData.quiz_streak || 0}</p>
            </div>
          </div>
        )}

        {showLeaderboard ? (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Family Leaderboard</h3>
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-2xl ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-gray-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="flex items-center space-x-1">
                        <Star className="w-4 h-4" />
                        <span>{user.quizScore}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Flame className="w-4 h-4" />
                        <span>{user.quizStreak}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {index < 3 && <Trophy className="w-8 h-8" />}
              </div>
            ))}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : question ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      question.difficulty === 'easy'
                        ? 'bg-green-200 text-green-800'
                        : question.difficulty === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {question.difficulty.toUpperCase()}
                    </span>
                    <div className="flex items-center space-x-2 text-blue-700">
                      <Book className="w-4 h-4" />
                      <span className="text-sm font-medium">{question.bibleReference}</span>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{question.question}</p>
                </div>

                <div className="space-y-3">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => !showResult && setSelectedAnswer(option)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                        showResult
                          ? option === question.correctAnswer
                            ? 'bg-green-100 border-2 border-green-500 text-green-900'
                            : option === selectedAnswer
                            ? 'bg-red-100 border-2 border-red-500 text-red-900'
                            : 'bg-gray-100 text-gray-500'
                          : selectedAnswer === option
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                          : 'bg-gray-100 border-2 border-transparent text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && option === question.correctAnswer && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {showResult && option === selectedAnswer && option !== question.correctAnswer && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {showResult && (
                  <div className={`rounded-2xl p-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center space-x-3 mb-2">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <h3 className="text-2xl font-bold text-green-900">Correct!</h3>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 text-red-600" />
                          <h3 className="text-2xl font-bold text-red-900">Incorrect</h3>
                        </>
                      )}
                    </div>
                    <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isCorrect
                        ? `Great job! You earned ${question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 30} points!`
                        : `The correct answer is: ${question.correctAnswer}`}
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  {!showResult ? (
                    <>
                      <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Answer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No questions available</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

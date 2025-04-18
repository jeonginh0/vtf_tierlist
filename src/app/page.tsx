'use client';

import { useState, useEffect } from 'react';
import TierList from '../components/TierList';
import Auth from '../components/Auth';
import { AuthState } from '../types/user';

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    currentUser: null,
    currentNickname: null
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    const currentNickname = localStorage.getItem('currentNickname');
    if (currentUser && currentNickname) {
      setAuthState({
        isLoggedIn: true,
        currentUser,
        currentNickname
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentNickname');
    setAuthState({
      isLoggedIn: false,
      currentUser: null,
      currentNickname: null
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">VTF 티어리스트</h1>
          <div>
            {authState.isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-white">
                  <span className="text-gray-400">환영합니다,</span>{' '}
                  <span className="font-medium">{authState.currentNickname}</span>
                  <span className="text-gray-400 text-sm ml-2">({authState.currentUser})</span>
                  <span className="ml-2 text-xs px-2 py-1 bg-blue-500 rounded-full">관리자</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                관리자 로그인
              </button>
            )}
          </div>
        </div>

        {/* 티어리스트 */}
        <TierList currentUser={authState.currentUser} />
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Auth 
              onAuthChange={(state) => {
                setAuthState(state);
                setShowLoginModal(false);
              }} 
            />
          </div>
        </div>
      )}
    </main>
  );
}


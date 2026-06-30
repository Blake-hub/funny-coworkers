'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import BoardList from '../components/board/BoardList';
import CreateBoardModal from '../components/board/CreateBoardModal';

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex">
      {isMobileSidebarOpen && (
        <Sidebar 
          onCreateBoard={handleOpenCreateModal}
          isMobile={true}
          onMobileToggle={handleMobileSidebarToggle}
        />
      )}
      <Sidebar 
        onCreateBoard={handleOpenCreateModal}
        isMobile={false}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden px-3 pt-2 pb-0 shrink-0">
          <button 
            onClick={handleMobileSidebarToggle}
            className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 p-4 pt-2 md:pt-4 overflow-y-auto min-h-0">
          <BoardList 
            isModalOpen={isModalOpen}
            onOpenModal={handleOpenCreateModal}
            onCloseModal={handleCloseCreateModal}
          />
        </main>
      </div>
    </div>
  );
}
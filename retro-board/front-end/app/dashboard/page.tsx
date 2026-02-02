'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../components/layout/HeaderBar';
import Sidebar from '../components/layout/Sidebar';
import BoardList from '../components/board/BoardList';
import CreateBoardModal from '../components/board/CreateBoardModal';

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
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

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <HeaderBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onCreateBoard={handleOpenCreateModal} />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-medium mb-2">My Boards</h1>
            <p className="text-neutral-400">Collaborate with your team on retrospectives</p>
          </div>
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/layout/HeaderBar';
import Sidebar from '../components/layout/Sidebar';
import BoardList from '../components/board/BoardList';
import CreateBoardModal from '../components/board/CreateBoardModal';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('common');
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
    <div className="min-h-screen bg-neutral-100 dark:bg-gray-900 flex flex-col">
      <HeaderBar onMobileMenuClick={handleMobileSidebarToggle} />
      <div className="flex flex-1 overflow-hidden">
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
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-medium mb-2">{t('dashboard.pageTitle')}</h1>
            <p className="text-neutral-400">{t('dashboard.pageDescription')}</p>
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
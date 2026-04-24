import { useState } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} flex flex-col h-screen`}>
        <main className="p-4 flex-1 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

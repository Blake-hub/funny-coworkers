import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import OrganizationTab from '@/components/Settings/OrganizationTab';

type TabType = 'profile' | 'organization' | 'notifications' | 'security';

export default function Settings() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('organization');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      setLoading(false);
    }
  }, [isAuthenticated, authLoading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isAdmin = user?.role === 'Project Manager' || user?.role === 'Admin';

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', enabled: true },
    { id: 'organization' as TabType, label: 'Organization', enabled: isAdmin },
    { id: 'notifications' as TabType, label: 'Notifications', enabled: true },
    { id: 'security' as TabType, label: 'Security', enabled: true },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and organization settings.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id)}
                disabled={!tab.enabled}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : tab.enabled
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                {tab.label}
                {!tab.enabled && (
                  <span className="ml-2 text-xs text-gray-400">(Admin only)</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="text-gray-600">
              <p>Profile settings coming soon...</p>
            </div>
          )}

          {activeTab === 'organization' && isAdmin && (
            <OrganizationTab />
          )}

          {activeTab === 'notifications' && (
            <div className="text-gray-600">
              <p>Notification settings coming soon...</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="text-gray-600">
              <p>Security settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import OrganizationTab from '@/components/Settings/OrganizationTab';
import { userApi } from '@/services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, Mail, Briefcase, Save, X } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

type TabType = 'profile' | 'organization' | 'notifications' | 'security';

function validateToken(token: string): { isValid: boolean; reason: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: 'invalid-token' };
    }

    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) {
      payloadStr += '=';
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));

    if (!payload || !payload.sub || typeof payload.exp !== 'number') {
      return { isValid: false, reason: 'invalid-token' };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return { isValid: false, reason: 'session-expired' };
    }

    return { isValid: true, reason: 'valid' };
  } catch {
    return { isValid: false, reason: 'invalid-token' };
  }
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login?reason=not-logged-in',
        permanent: false,
      },
    };
  }

  const validationResult = validateToken(token);

  if (!validationResult.isValid) {
    return {
      redirect: {
        destination: `/login?reason=${validationResult.reason}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user, updateUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('organization');
  const [loading, setLoading] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?reason=not-logged-in');
        return;
      }

      setLoading(false);
    }
  }, [isAuthenticated, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileForm.name || !profileForm.email) {
      setProfileError(t('settings.fillAll'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setProfileError(t('settings.invalidEmail'));
      return;
    }

    setIsUpdatingProfile(true);

    try {
      const updatedUser = await userApi.updateUser(parseInt(user!.id), {
        name: profileForm.name,
        email: profileForm.email,
        role: profileForm.role,
      });
      updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
      setProfileSuccess(t('settings.profileUpdated'));
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileError(error.message || t('settings.profileUpdateFailed'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      });
    }
    setProfileError('');
    setProfileSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('settings.passwordFillAll'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }

    setIsChangingPassword(true);

    try {
      await userApi.changePassword(parseInt(user!.id), currentPassword, newPassword);
      setPasswordSuccess(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.message || t('settings.passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { id: 'profile' as TabType, label: t('settings.tabProfile'), enabled: true },
    { id: 'organization' as TabType, label: t('settings.tabOrganization'), enabled: isAdmin },
    { id: 'notifications' as TabType, label: t('settings.tabNotifications'), enabled: true },
    { id: 'security' as TabType, label: t('settings.tabSecurity'), enabled: true },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
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
                  <span className="ml-2 text-xs text-gray-400">{t('settings.adminOnly')}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">{t('settings.myProfile')}</h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    {t('settings.editProfile')}
                  </button>
                )}
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <CheckCircle className="w-5 h-5" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="max-w-md">
                {profileError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.name')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!isEditingProfile}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditingProfile
                          ? 'border-gray-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      disabled={!isEditingProfile}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditingProfile
                          ? 'border-gray-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.role')}</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                      disabled={!isEditingProfile}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isEditingProfile
                          ? 'border-gray-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <option value="Developer">{t('settings.roleDeveloper')}</option>
                      <option value="Project Manager">{t('settings.roleManager')}</option>
                      <option value="Admin">{t('settings.roleAdmin')}</option>
                      <option value="QA Tester">{t('settings.roleQA')}</option>
                      <option value="Designer">{t('settings.roleDesigner')}</option>
                    </select>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isUpdatingProfile ? t('settings.saving') : t('settings.saveChanges')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'organization' && isAdmin && (
            <OrganizationTab />
          )}

          {activeTab === 'notifications' && (
            <div className="text-gray-600">
              <p>{t('settings.notificationsComingSoon')}</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.changePassword')}</h2>
              
              {passwordSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                  <CheckCircle className="w-5 h-5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="max-w-md">
                {passwordError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.currentPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.newPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('settings.newPasswordPlaceholder')}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('settings.passwordHint')}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.confirmPassword')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? t('settings.changing') : t('settings.changeButton')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

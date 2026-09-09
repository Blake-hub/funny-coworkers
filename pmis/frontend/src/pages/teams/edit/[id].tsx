import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi, userApi, TeamResponse, UserResponse } from '@/services/api';
import Layout from '@/components/Layout/Layout';
import { Save, Users, Hash, Trash2, AlertCircle, UserCircle } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function EditTeam() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    description: '',
    memberCount: 0,
    leadName: '',
  });
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserResponse[]>([]);
  const [newOwnerId, setNewOwnerId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchTeam = async () => {
      try {
        setHasError(false);
        setErrorMessage('');
        
        const teamData = await teamApi.getTeamById(Number(id));
        setTeam(teamData);
        setFormData({
          name: teamData.name,
          identifier: teamData.identifier,
          description: teamData.description || '',
          memberCount: teamData.memberCount,
          leadName: teamData.leadName || '',
        });

        try {
          const members = await teamApi.getTeamMembers(Number(id));
          setTeamMembers(members);
        } catch (membersError) {
          console.error('Failed to fetch team members:', membersError);
          addToast('warning', t('teams.loadMembersWarning'));
        }
      } catch (error) {
        console.error('Failed to fetch team:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : t('teams.loadFailed'));
        addToast('error', t('teams.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && id) {
      fetchTeam();
    }
  }, [isAuthenticated, authLoading, router, id, addToast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (hasError) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-800 mb-2">{t('teams.errorLoading')}</h1>
            <p className="text-red-600">{errorMessage}</p>
            <button
              onClick={() => router.push('/teams')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('teams.backToTeams')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('teams.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('teams.nameMinLength');
    }

    if (!formData.identifier.trim()) {
      newErrors.identifier = t('teams.identifierRequired');
    } else if (!/^[A-Z0-9]+$/.test(formData.identifier)) {
      newErrors.identifier = t('teams.identifierFormat');
    } else if (formData.identifier.length < 2 || formData.identifier.length > 10) {
      newErrors.identifier = t('teams.identifierLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await teamApi.updateTeam(Number(id), {
        name: formData.name.trim(),
        identifier: formData.identifier.trim().toUpperCase(),
        description: formData.description.trim() || 'No description provided',
        memberCount: formData.memberCount,
        leadName: formData.leadName.trim(),
      });

      addToast('success', t('teams.updated'));

      setTimeout(() => {
        router.push('/teams');
      }, 1000);
    } catch (error) {
      console.error('Failed to update team:', error);
      addToast('error', t('teams.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await teamApi.deleteTeam(Number(id));
      addToast('success', t('teams.deleted'));
      
      setTimeout(() => {
        router.push('/teams');
      }, 1000);
    } catch (error) {
      console.error('Failed to delete team:', error);
      addToast('error', t('teams.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId || !id) return;
    
    setIsTransferring(true);
    
    try {
      await teamApi.transferOwnership(Number(id), newOwnerId);
      addToast('success', t('teams.ownershipTransferred'));
      
      setTimeout(() => {
        router.push('/teams');
      }, 1000);
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
      addToast('error', t('teams.transferFailed'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('teams.editTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('teams.editSubtitle')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teams.name')}</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('teams.namePlaceholder')}
                  data-testid="team-name-input"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teams.identifier')}</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleChange('identifier', e.target.value.toUpperCase())}
                  placeholder={t('teams.identifierPlaceholder')}
                  data-testid="team-identifier-input"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all uppercase ${errors.identifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'}`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('teams.identifierHint')}</p>
              {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teams.descriptionOptional')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('teams.descriptionPlaceholder')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teams.memberCount')}</label>
              <input
                type="number"
                value={formData.memberCount}
                onChange={(e) => handleChange('memberCount', Number(e.target.value))}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teams.teamLeadOptional')}</label>
              <input
                type="text"
                value={formData.leadName}
                onChange={(e) => handleChange('leadName', e.target.value)}
                placeholder={t('teams.teamLeadPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
              />
            </div>

            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCircle className="w-5 h-5 text-blue-600" />
                <label className="block text-sm font-medium text-blue-800">{t('teams.transferOwnership')}</label>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                {t('teams.currentOwner', { name: team?.ownerName || t('common.notSet') })}
              </p>
              <select
                value={newOwnerId || ''}
                onChange={(e) => setNewOwnerId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('teams.selectNewOwner')}</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleTransferOwnership}
                disabled={!newOwnerId || isTransferring}
                className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isTransferring ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    {t('teams.transferring')}
                  </>
                ) : (
                  t('teams.transfer')
                )}
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/teams')}
                data-testid="cancel-button"
                className="text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg font-medium transition-all text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="delete-button"
                className="bg-gray-100 text-gray-600 hover:bg-gray-200 py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="save-changes-button"
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('teams.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('teams.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('teams.deleteTitle')}</h3>
                  <p className="text-gray-600 mt-1">{t('teams.deleteConfirm')}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg font-medium transition-all text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

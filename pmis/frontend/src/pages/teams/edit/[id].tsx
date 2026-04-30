import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import Layout from '@/components/Layout/Layout';
import { Save, Users, Hash, Trash2, AlertCircle } from 'lucide-react';

export default function EditTeam() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    description: '',
    memberCount: 0,
    leadName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchTeam = async () => {
      try {
        const team = await teamApi.getTeamById(Number(id));
        setFormData({
          name: team.name,
          identifier: team.identifier,
          description: team.description || '',
          memberCount: team.memberCount,
          leadName: team.leadName || '',
        });
      } catch (error) {
        console.error('Failed to fetch team:', error);
        addToast('error', 'Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [isAuthenticated, router, id, addToast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Identifier is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Identifier must contain only uppercase letters and numbers';
    } else if (formData.identifier.length < 2 || formData.identifier.length > 10) {
      newErrors.identifier = 'Identifier must be 2-10 characters';
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

      addToast('success', 'Team updated successfully!');
      
      setTimeout(() => {
        router.push('/teams');
      }, 1000);
    } catch (error) {
      console.error('Failed to update team:', error);
      addToast('error', 'Failed to update team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await teamApi.deleteTeam(Number(id));
      addToast('success', 'Team deleted successfully!');
      
      setTimeout(() => {
        router.push('/teams');
      }, 1000);
    } catch (error) {
      console.error('Failed to delete team:', error);
      addToast('error', 'Failed to delete team. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Edit Team</h1>
          <p className="text-gray-500 mt-1">Update team information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter team name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Identifier</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleChange('identifier', e.target.value.toUpperCase())}
                  placeholder="Enter identifier"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all uppercase ${errors.identifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'}`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be 2-10 characters, uppercase letters and numbers only</p>
              {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter team description..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Count</label>
              <input
                type="number"
                value={formData.memberCount}
                onChange={(e) => handleChange('memberCount', Number(e.target.value))}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Lead (optional)</label>
              <input
                type="text"
                value={formData.leadName}
                onChange={(e) => handleChange('leadName', e.target.value)}
                placeholder="Enter team lead name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/teams')}
                className="text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg font-medium transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-gray-100 text-gray-600 hover:bg-gray-200 py-2 px-4 rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
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
                  <h3 className="text-lg font-semibold text-gray-800">Delete Team</h3>
                  <p className="text-gray-600 mt-1">Are you sure you want to delete this team? This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-600 hover:text-gray-700 py-2 px-4 rounded-lg font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
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

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import Layout from '@/components/Layout/Layout';
import { Plus, Users, Hash } from 'lucide-react';

export default function CreateTeam() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return null;
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
      await teamApi.createTeam({
        name: formData.name.trim(),
        identifier: formData.identifier.trim().toUpperCase(),
        description: formData.description.trim() || 'No description provided',
        memberCount: 0,
        leadName: '',
      });

      addToast('success', 'Team created successfully!');
      
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      console.error('Failed to create team:', error);
      addToast('error', 'Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
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
          <h1 className="text-2xl font-bold text-gray-800">Create New Team</h1>
          <p className="text-gray-500 mt-1">Add a new team to your organization</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">

            {/* Team Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter team name (e.g., Engineering Team)"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'
                      : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-gray-600">{errors.name}</p>
              )}
            </div>

            {/* Identifier */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identifier
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleChange('identifier', e.target.value.toUpperCase())}
                  placeholder="Enter identifier (e.g., ENG, QA)"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all uppercase ${
                    errors.identifier
                      ? 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'
                      : 'border-gray-300 focus:ring-gray-200 focus:border-gray-400'
                  }`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be 2-10 characters, uppercase letters and numbers only
              </p>
              {errors.identifier && (
                <p className="mt-1 text-sm text-gray-600">{errors.identifier}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter team description..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all resize-none"
              />
            </div>

            {/* Create Button Row */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
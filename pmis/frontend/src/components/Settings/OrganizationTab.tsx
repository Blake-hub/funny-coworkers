import { useEffect, useState } from 'react';
import { organizationApi, type OrganizationResponse, type DepartmentResponse, type UserResponse } from '@/services/api';
import { Building2, Users, Network, Plus, Pencil, Trash2, ChevronRight, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/router';

interface DepartmentTreeNode extends DepartmentResponse {
  children: DepartmentTreeNode[];
}

export default function OrganizationTab() {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([]);
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editingOrg, setEditingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', description: '', website: '' });
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({});
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentTreeNode | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', parentDepartmentId: undefined as number | undefined });

  const ORG_ID = 1;

  useEffect(() => {
    const token = localStorage.getItem('pmis-token');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const [orgData, deptsData, empsData] = await Promise.all([
        organizationApi.getOrganization(ORG_ID),
        organizationApi.getDepartments(ORG_ID),
        organizationApi.getEmployees(ORG_ID),
      ]);
      setOrganization(orgData);
      setOrgForm({
        name: orgData.name,
        description: orgData.description || '',
        website: orgData.website || '',
      });
      setDepartments(buildTree(deptsData));
      setEmployees(empsData);
    } catch (error: any) {
      console.error('Failed to load organization data:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setAuthError('Your session has expired. Please log out and log back in.');
      } else {
        setAuthError('Failed to load organization data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (depts: DepartmentResponse[]): DepartmentTreeNode[] => {
    const deptMap = new Map<number, DepartmentTreeNode>();
    const roots: DepartmentTreeNode[] = [];

    depts.forEach(dept => {
      deptMap.set(dept.id, { ...dept, children: [] });
    });

    depts.forEach(dept => {
      const node = deptMap.get(dept.id)!;
      if (dept.parentDepartmentId && deptMap.has(dept.parentDepartmentId)) {
        deptMap.get(dept.parentDepartmentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleDept = (id: number) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveOrg = async () => {
    try {
      await organizationApi.updateOrganization(ORG_ID, orgForm);
      setEditingOrg(false);
      loadData();
    } catch (error) {
      console.error('Failed to update organization:', error);
    }
  };

  const handleSaveDept = async () => {
    try {
      if (editingDept) {
        await organizationApi.updateDepartment(editingDept.id, deptForm);
      } else {
        await organizationApi.createDepartment(ORG_ID, deptForm);
      }
      setShowDeptModal(false);
      setEditingDept(null);
      setDeptForm({ name: '', description: '', parentDepartmentId: undefined });
      loadData();
    } catch (error) {
      console.error('Failed to save department:', error);
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await organizationApi.deleteDepartment(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  const openEditDept = (dept: DepartmentTreeNode) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      parentDepartmentId: dept.parentDepartmentId || undefined,
    });
    setShowDeptModal(true);
  };

  const getAllDepartments = (nodes: DepartmentTreeNode[]): DepartmentTreeNode[] => {
    const result: DepartmentTreeNode[] = [];
    const stack = [...nodes];
    while (stack.length > 0) {
      const node = stack.pop()!;
      result.push(node);
      stack.push(...node.children);
    }
    return result;
  };

  const flattenTree = (nodes: DepartmentTreeNode[], depth = 0): Array<{ node: DepartmentTreeNode; depth: number }> => {
    const result: Array<{ node: DepartmentTreeNode; depth: number }> = [];
    nodes.forEach(node => {
      result.push({ node, depth });
      if (expandedDepts[node.id]) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    });
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{authError}</p>
        <button
          onClick={() => {
            setAuthError(null);
            loadData();
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const flatDepts = flattenTree(departments);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Organization settings are only visible to administrators.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Organization Information</h2>
          </div>
          {!editingOrg ? (
            <button
              onClick={() => setEditingOrg(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingOrg(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrg}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {editingOrg ? (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={orgForm.description}
                onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={orgForm.website}
                onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{organization?.name || 'N/A'}</h3>
            <p className="text-gray-600 mb-2">{organization?.description || 'No description'}</p>
            {organization?.website && (
              <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm">
                {organization.website}
              </a>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Organization Structure</h2>
          </div>
          <button
            onClick={() => {
              setEditingDept(null);
              setDeptForm({ name: '', description: '', parentDepartmentId: undefined });
              setShowDeptModal(true);
            }}
            className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          {flatDepts.length === 0 ? (
            <p className="text-gray-500 text-sm">No departments yet. Add your first department to build the organization structure.</p>
          ) : (
            <div className="space-y-1">
              {flatDepts.map(({ node, depth }) => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 group"
                  style={{ paddingLeft: `${depth * 24 + 12}px` }}
                >
                  {node.children.length > 0 ? (
                    <button onClick={() => toggleDept(node.id)} className="text-gray-400 hover:text-gray-600">
                      {expandedDepts[node.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="flex-1 font-medium text-gray-800">{node.name}</span>
                  <span className="text-sm text-gray-500">{node.description}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => openEditDept(node)} className="p-1 text-gray-400 hover:text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteDept(node.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Employees</h2>
          <span className="text-sm text-gray-500">({employees.length})</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          {employees.length === 0 ? (
            <p className="text-gray-500 text-sm">No employees found in this organization.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-gray-600">{emp.email}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                          {emp.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingDept ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Department description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Department (Optional)</label>
                <select
                  value={deptForm.parentDepartmentId || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent (Root department)</option>
                  {getAllDepartments(departments).map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDept}
                disabled={!deptForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
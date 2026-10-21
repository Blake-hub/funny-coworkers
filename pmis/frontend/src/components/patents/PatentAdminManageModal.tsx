import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, ShieldCheck } from 'lucide-react';
import { patentAdminApi, userApi, type PatentAdminResponse, type UserResponse } from '@/services/api';
import { useToast } from '@/context/ToastContext';

interface PatentAdminManageModalProps {
  open: boolean;
  onClose: () => void;
}

/** Global ADMIN dialog: grant / revoke the module-level patent admin role. */
export default function PatentAdminManageModal({ open, onClose }: PatentAdminManageModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [admins, setAdmins] = useState<PatentAdminResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const [adminList, userList] = await Promise.all([
          patentAdminApi.list(),
          userApi.getAllUsers(),
        ]);
        setAdmins(adminList);
        setUsers(userList);
      } catch (err) {
        addToast('error', t('patents.admin.loadFailed'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, t, addToast]);

  if (!open) return null;

  const adminIds = new Set(admins.map((a) => a.userId));
  const candidates = users.filter(
    (u) =>
      !adminIds.has(u.id) &&
      (userSearch === '' ||
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase()))
  );

  const handleGrant = async (userId: number) => {
    setBusy(true);
    try {
      await patentAdminApi.grant(userId);
      setAdmins(await patentAdminApi.list());
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (userId: number) => {
    if (!window.confirm(t('patents.admin.revokeConfirm'))) return;
    setBusy(true);
    try {
      await patentAdminApi.revoke(userId);
      setAdmins(await patentAdminApi.list());
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('patents.error.updateFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">{t('patents.admin.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-sm text-gray-500 py-6 text-center">…</div>
          ) : admins.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center">{t('patents.admin.empty')}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.admin.user')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.admin.grantedBy')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('patents.admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((a) => (
                  <tr key={a.userId}>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800">{a.userName || a.userId}</div>
                      <div className="text-xs text-gray-500">{a.userEmail}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">{a.grantedByName || a.grantedBy}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleRevoke(a.userId)}
                        disabled={busy}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        {t('patents.admin.revoke')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('patents.admin.title')}
              className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
            {candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-gray-800">{u.name || u.id}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </div>
                <button
                  onClick={() => handleGrant(u.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {t('patents.admin.grant')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

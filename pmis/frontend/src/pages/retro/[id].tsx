import { useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import {
  retroApi,
  type BoardDTO,
  type ColumnDTO,
  type CardDTO,
  type BoardUpdateEvent,
} from '@/services/retroApi';
import { userApi, type UserResponse } from '@/services/api';
import { useRetroWebSocket } from '@/hooks/useRetroWebSocket';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, X, Users, MessageSquare, ChevronDown, ThumbsUp, Trash2, Pencil, Check, ArrowLeft, ArrowUpDown,
} from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: {} };
}

// ---------- Avatar helpers ----------
const AVATAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'];
function getAvatarColor(id: number): string { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ---------- Sortable Card ----------
interface SortableCardProps {
  card: CardDTO;
  isEnded: boolean;
  canEdit: boolean;
  sortLocked?: boolean;
  onVote: (id: number) => void;
  onEdit: (card: CardDTO) => void;
  onDelete: (id: number) => void;
  onOpen: (card: CardDTO) => void;
}

function SortableCard({ card, isEnded, canEdit, sortLocked = false, onVote, onEdit, onDelete, onOpen }: SortableCardProps) {
  const { t } = useTranslation();
  const dragDisabled = isEnded || sortLocked || !canEdit;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `card-${card.id}`, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      title={t('retro.detail.cardDetail')}
      className={`bg-white border border-gray-200 rounded-lg p-2.5 mb-2 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow group h-36 flex flex-col ${dragDisabled ? (isEnded ? 'cursor-pointer' : 'cursor-default') : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 flex-1 break-words line-clamp-2">{card.title}</p>
        {!isEnded && canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="p-0.5 text-gray-400 hover:text-gray-700" title={t('retro.detail.editCard')}>
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="p-0.5 text-gray-400 hover:text-red-500" title={t('common.delete')}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {card.description && (
        <div className="flex-1 min-h-0 overflow-hidden mt-1">
          <p className="text-xs text-gray-500 break-words whitespace-pre-wrap line-clamp-4">{card.description}</p>
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2">
        <button
          onClick={(e) => { e.stopPropagation(); if (!isEnded) onVote(card.id); }}
          disabled={isEnded}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
            card.votedByCurrentUser
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } ${isEnded ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <ThumbsUp className="w-3 h-3" />
          <span>{card.votes}</span>
        </button>
      </div>
    </div>
  );
}

// ---------- Droppable Column Container ----------
// Makes the column body a droppable target so cards can be dropped into empty columns
function DroppableColumn({ id, disabled = false, children }: { id: string; disabled?: boolean; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-2 transition-colors ${isOver ? 'bg-blue-50' : ''}`}
      style={{ minHeight: '50px' }}
    >
      {children}
    </div>
  );
}

// ---------- Card Edit Dialog ----------
interface CardEditDialogProps {
  card: CardDTO | null;
  readOnly?: boolean;
  onSave: (id: number, title: string, description: string) => void;
  onClose: () => void;
}

function CardEditDialog({ card, readOnly = false, onSave, onClose }: CardEditDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
    }
  }, [card]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!card) return null;

  // Calculate dialog width: screen width minus 16px padding on each side, capped at 448px (md)
  const dialogWidth = Math.min(viewportWidth - 32, 448);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl flex flex-col max-h-[85dvh]"
        style={{ width: `${dialogWidth}px`, maxWidth: 'calc(100vw - 16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: dialog title + votes + close */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-xs font-semibold text-gray-700 shrink-0">{readOnly ? t('retro.detail.cardDetail') : t('retro.detail.editCard')}</h3>
            <div className="flex items-center gap-0.5 text-xs text-gray-400 shrink-0">
              <ThumbsUp className="w-3 h-3" />
              <span>{card.votes}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
        </div>
        {/* Body: title (label inline) + description, fills available space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Title row: label + input/text on one line */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">{t('retro.detail.title')}</label>
            {readOnly ? (
              <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap break-words flex-1 min-w-0">{card.title}</p>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none"
                autoFocus
              />
            )}
          </div>
          {/* Description: label + content, fills remaining space */}
          <div className="px-3 pt-1 pb-2 flex-1 min-h-0 flex flex-col">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('common.description')}</label>
            {readOnly ? (
              card.description ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{card.description}</p>
              ) : (
                <p className="text-sm text-gray-400">{t('retro.detail.noDescription')}</p>
              )
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none resize-none min-h-[120px]"
              />
            )}
          </div>
        </div>
        {/* Footer: cancel + save together on the right */}
        <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-t border-gray-200">
          {readOnly ? (
            <button onClick={onClose} className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">{t('common.close')}</button>
          ) : (
            <>
              <button onClick={onClose} className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">{t('common.cancel')}</button>
              <button
                onClick={() => onSave(card.id, title, description)}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                {t('common.save')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Invite Dialog ----------
interface InviteDialogProps {
  boardId: number;
  currentParticipantIds: number[];
  users: UserResponse[];
  onInvited: () => void;
  onClose: () => void;
}

function InviteDialog({ boardId, currentParticipantIds, users, onInvited, onClose }: InviteDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number[]>([]);
  const [inviting, setInviting] = useState(false);
  const { addToast } = useToast();

  const availableUsers = users.filter((u) => !currentParticipantIds.includes(u.id));

  const toggle = (uid: number) => {
    setSelected((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const handleInvite = async () => {
    if (selected.length === 0) return;
    setInviting(true);
    try {
      await retroApi.inviteParticipants(boardId, { userIds: selected });
      addToast('success', t('retro.detail.inviteSuccess'));
      onInvited();
      onClose();
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">{t('retro.detail.inviteTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4">
          {availableUsers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{t('retro.detail.noUsersToInvite')}</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded">
                  <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="w-4 h-4" />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(u.id)}`}>
                    {getInitials(u.name)}
                  </div>
                  <span className="text-sm text-gray-700">{u.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{u.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{t('common.cancel')}</button>
          <button
            onClick={handleInvite}
            disabled={inviting || selected.length === 0}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? t('retro.detail.inviting') : `${t('retro.detail.invite')} (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function RetroDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();

  const [board, setBoard] = useState<BoardDTO | null>(null);
  const [columns, setColumns] = useState<ColumnDTO[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<number, CardDTO[]>>({});
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [renamingColumnId, setRenamingColumnId] = useState<number | null>(null);
  const [columnNameDraft, setColumnNameDraft] = useState('');
  const [addingCardColumnId, setAddingCardColumnId] = useState<number | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  // 按票数排序的列（纯视图偏好，仅当前客户端生效，不调后端）；激活时该列禁用拖拽
  const [voteSortCols, setVoteSortCols] = useState<Set<number>>(new Set());
  const toggleVoteSort = useCallback((colId: number) => {
    setVoteSortCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }, []);

  // Dialogs
  const [editingCard, setEditingCard] = useState<CardDTO | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  // Drag state
  const [activeCard, setActiveCard] = useState<CardDTO | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const boardIdNum = id ? Number(id) : null;
  const isEnded = board?.status === 'ENDED';
  const isOwner = !!board && !!user && board.ownerId === Number(user.id);

  // ---------- WS ----------
  const handleWsEvent = useCallback((event: BoardUpdateEvent) => {
    if (!boardIdNum) return;
    if (event.boardId !== boardIdNum) return;

    switch (event.type) {
      case 'card_created': {
        const card = event.data as CardDTO;
        setCardsByColumn((prev) => {
          const list = prev[card.columnId] || [];
          // Avoid duplicates
          if (list.some((c) => c.id === card.id)) return prev;
          return { ...prev, [card.columnId]: [...list, card] };
        });
        break;
      }
      case 'card_updated': {
        const card = event.data as CardDTO;
        setCardsByColumn((prev) => {
          const result: Record<number, CardDTO[]> = {};
          for (const [colIdStr, list] of Object.entries(prev)) {
            const colId = Number(colIdStr);
            const filtered = list.filter((c) => c.id !== card.id);
            if (colId === card.columnId) {
              result[colId] = [...filtered, card].sort((a, b) => a.position - b.position);
            } else {
              result[colId] = filtered;
            }
          }
          return result;
        });
        break;
      }
      case 'card_deleted': {
        const cardId = event.data as number;
        setCardsByColumn((prev) => {
          const result: Record<number, CardDTO[]> = {};
          for (const [colIdStr, list] of Object.entries(prev)) {
            result[Number(colIdStr)] = list.filter((c) => c.id !== cardId);
          }
          return result;
        });
        break;
      }
      case 'card_voted': {
        const card = event.data as CardDTO;
        setCardsByColumn((prev) => {
          const result: Record<number, CardDTO[]> = {};
          for (const [colIdStr, list] of Object.entries(prev)) {
            result[Number(colIdStr)] = list.map((c) => c.id === card.id ? card : c);
          }
          return result;
        });
        break;
      }
      case 'column_created': {
        const col = event.data as ColumnDTO;
        setColumns((prev) => prev.some((c) => c.id === col.id) ? prev : [...prev, col]);
        setCardsByColumn((prev) => ({ ...prev, [col.id]: [] }));
        break;
      }
      case 'column_updated': {
        const col = event.data as ColumnDTO;
        setColumns((prev) => prev.map((c) => c.id === col.id ? col : c));
        break;
      }
      case 'column_deleted': {
        const colId = event.data as number;
        setColumns((prev) => prev.filter((c) => c.id !== colId));
        setCardsByColumn((prev) => {
          const { [colId]: _omit, ...rest } = prev;
          return rest;
        });
        break;
      }
    }
  }, [boardIdNum]);

  useRetroWebSocket({ boardId: boardIdNum, token, onEvent: handleWsEvent });

  // ---------- Data fetching ----------
  const fetchBoard = useCallback(async (): Promise<boolean> => {
    if (!boardIdNum) return false;
    try {
      const b = await retroApi.getBoardById(boardIdNum);
      setBoard(b);
      setTitleDraft(b.title);
      return true;
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
      return false;
    }
  }, [boardIdNum, addToast]);

  const fetchColumns = useCallback(async () => {
    if (!boardIdNum) return;
    try {
      const cols = await retroApi.getColumnsByBoard(boardIdNum);
      setColumns(cols);
      // Fetch cards for each column
      const cardsMap: Record<number, CardDTO[]> = {};
      await Promise.all(cols.map(async (col) => {
        const cards = await retroApi.getCardsByColumn(col.id);
        cardsMap[col.id] = cards.sort((a, b) => a.position - b.position);
      }));
      setCardsByColumn(cardsMap);
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  }, [boardIdNum, addToast]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!boardIdNum) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Fetch board first — validates participant permission.
      // Only proceed to columns/cards if board loads successfully,
      // preventing duplicate "Not a participant" toasts from parallel failures.
      const ok = await fetchBoard();
      if (!cancelled && ok) {
        await Promise.all([fetchColumns(), fetchUsers()]);
      } else if (!cancelled) {
        // Permission denied or board not found — skip columns
        await fetchUsers();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router.isReady, boardIdNum, fetchBoard, fetchColumns, fetchUsers]);

  // ---------- Handlers ----------
  const handleSaveTitle = async () => {
    if (!boardIdNum || !titleDraft.trim()) return;
    try {
      await retroApi.updateBoard(boardIdNum, { title: titleDraft.trim() });
      setBoard((prev) => prev ? { ...prev, title: titleDraft.trim() } : prev);
      setEditingTitle(false);
      addToast('success', t('retro.detail.titleUpdated'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleEndBoard = async () => {
    if (!boardIdNum) return;
    if (!window.confirm(t('retro.detail.endConfirm'))) return;
    try {
      await retroApi.endBoard(boardIdNum);
      setBoard((prev) => prev ? { ...prev, status: 'ENDED' } : prev);
      addToast('success', t('retro.detail.boardEnded'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    if (!boardIdNum) return;
    if (!window.confirm(t('retro.detail.removeParticipantConfirm'))) return;
    try {
      await retroApi.removeParticipant(boardIdNum, userId);
      await fetchBoard();
      addToast('success', t('retro.detail.participantRemoved'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleAddColumn = async () => {
    if (!boardIdNum || !newColumnName.trim()) return;
    try {
      await retroApi.createColumn({ name: newColumnName.trim(), boardId: boardIdNum });
      setNewColumnName('');
      setAddingColumn(false);
      // WS will broadcast column_created
      // But also refetch to be safe
      await fetchColumns();
      addToast('success', t('retro.detail.columnCreated'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleRenameColumn = async (colId: number) => {
    if (!columnNameDraft.trim()) return;
    try {
      await retroApi.updateColumn(colId, { name: columnNameDraft.trim() });
      setColumns((prev) => prev.map((c) => c.id === colId ? { ...c, name: columnNameDraft.trim() } : c));
      setRenamingColumnId(null);
      addToast('success', t('retro.detail.columnRenamed'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleDeleteColumn = async (colId: number) => {
    if (!window.confirm(t('retro.detail.deleteColumnConfirm'))) return;
    try {
      await retroApi.deleteColumn(colId);
      addToast('success', t('retro.detail.columnDeleted'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleAddCard = async (columnId: number) => {
    if (!newCardTitle.trim()) return;
    try {
      await retroApi.createCard({ title: newCardTitle.trim(), columnId });
      setNewCardTitle('');
      setAddingCardColumnId(null);
      addToast('success', t('retro.detail.cardCreated'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleSaveCard = async (cardId: number, title: string, description: string) => {
    try {
      await retroApi.updateCard(cardId, { title, description });
      setEditingCard(null);
      addToast('success', t('retro.detail.cardUpdated'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm(t('retro.detail.deleteCardConfirm'))) return;
    try {
      await retroApi.deleteCard(cardId);
      addToast('success', t('retro.detail.cardDeleted'));
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  const handleVote = async (cardId: number) => {
    try {
      await retroApi.voteCard(cardId);
      // WS will broadcast card_voted
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  // ---------- DnD ----------
  const dragStartInfoRef = useRef<{ colId: number; index: number } | null>(null);
  const crossColMovedRef = useRef(false);
  // 拖拽结束时间戳：dnd-kit 在 drag 后仍会派发 click，200ms 内的 click 视为拖拽误触，不打开详情
  const lastDragEndRef = useRef(0);

  const handleOpenCard = useCallback((card: CardDTO) => {
    if (Date.now() - lastDragEndRef.current < 200) return;
    setEditingCard(card);
  }, []);

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const cardId = Number(id.replace('card-', ''));
    for (const [colIdStr, list] of Object.entries(cardsByColumn)) {
      const idx = list.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        setActiveCard(list[idx]);
        dragStartInfoRef.current = { colId: Number(colIdStr), index: idx };
        break;
      }
    }
  };

  // 拖拽经过其他列时，把卡片实时"预插入"目标列：目标列卡片自动让位，显示插入位置指示
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeCardId = Number(String(active.id).replace('card-', ''));
    const overId = String(over.id);

    setCardsByColumn((prev) => {
      let sourceColId: number | null = null;
      let sourceIndex = -1;
      for (const [colIdStr, list] of Object.entries(prev)) {
        const idx = list.findIndex((c) => c.id === activeCardId);
        if (idx >= 0) {
          sourceColId = Number(colIdStr);
          sourceIndex = idx;
          break;
        }
      }
      if (sourceColId == null) return prev;

      let destColId: number | null = null;
      let destIndex = -1;
      if (overId.startsWith('card-')) {
        const overCardId = Number(overId.replace('card-', ''));
        for (const [colIdStr, list] of Object.entries(prev)) {
          const idx = list.findIndex((c) => c.id === overCardId);
          if (idx >= 0) {
            destColId = Number(colIdStr);
            destIndex = idx;
            break;
          }
        }
      } else if (overId.startsWith('col-')) {
        destColId = Number(overId.replace('col-', ''));
      }
      if (destColId == null || destColId === sourceColId) return prev;

      // 插入位置：悬停在卡片上时，按拖拽卡片中心与目标卡片中心的相对位置决定插前/插后
      let insertIdx: number;
      if (destIndex >= 0) {
        const overRect = over.rect;
        const activeRect = active.rect.current.translated;
        const isBelow = activeRect && overRect
          ? activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2
          : false;
        insertIdx = isBelow ? destIndex + 1 : destIndex;
      } else {
        insertIdx = (prev[destColId] || []).length;
      }

      const src = [...prev[sourceColId]];
      const [moved] = src.splice(sourceIndex, 1);
      const dest = [...(prev[destColId] || [])];
      dest.splice(insertIdx, 0, { ...moved, columnId: destColId });
      crossColMovedRef.current = true;
      return {
        ...prev,
        // 规范化 position，避免 WS card_updated 按 position 排序时因并列错序
        [sourceColId]: src.map((c, i) => ({ ...c, position: i })),
        [destColId]: dest.map((c, i) => ({ ...c, position: i })),
      };
    });
  };

  // 拖拽中断（取消/拖到容器外）：若已跨列预插入则还原为后端状态
  const restoreAfterDragAbort = async () => {
    dragStartInfoRef.current = null;
    if (crossColMovedRef.current) {
      crossColMovedRef.current = false;
      await fetchColumns();
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveCard(null);
    lastDragEndRef.current = Date.now();
    const startInfo = dragStartInfoRef.current;
    dragStartInfoRef.current = null;

    if (!e.over) {
      await restoreAfterDragAbort();
      return;
    }

    const activeCardId = Number(String(e.active.id).replace('card-', ''));
    const overId = String(e.over.id);

    // 卡片当前所在列/位置（跨列拖拽时 handleDragOver 已将其预插入目标列）
    let colId: number | null = null;
    let curIdx = -1;
    for (const [colIdStr, list] of Object.entries(cardsByColumn)) {
      const idx = list.findIndex((c) => c.id === activeCardId);
      if (idx >= 0) {
        colId = Number(colIdStr);
        curIdx = idx;
        break;
      }
    }
    if (colId == null || curIdx < 0) return;

    // 计算列内最终位置
    let finalIdx = curIdx;
    if (overId.startsWith('card-')) {
      const overCardId = Number(overId.replace('card-', ''));
      if (overCardId !== activeCardId) {
        const overIdx = (cardsByColumn[colId] || []).findIndex((c) => c.id === overCardId);
        if (overIdx >= 0) {
          const overRect = e.over.rect;
          const activeRect = e.active.rect.current.translated;
          const isBelow = activeRect && overRect
            ? activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2
            : false;
          if (startInfo && startInfo.colId === colId) {
            // 同列：与 dnd-kit sortable 预览语义一致，over 卡片即目标索引
            finalIdx = overIdx;
          } else if (curIdx < overIdx) {
            // 跨列：dragOver 已预插入，按中心位置微调
            finalIdx = isBelow ? overIdx : overIdx - 1;
          } else if (curIdx > overIdx) {
            finalIdx = isBelow ? overIdx + 1 : overIdx;
          }
        }
      }
    } else if (overId.startsWith('col-')) {
      const overColId = Number(overId.replace('col-', ''));
      if (overColId !== colId) {
        // 未经 handleDragOver 直接落到另一列（边缘情况）：追加到末尾
        colId = overColId;
        finalIdx = (cardsByColumn[overColId] || []).length;
      }
    }

    // 位置无变化（原位放下、或跨列预览后又拖回原位）：不调接口
    if (startInfo && startInfo.colId === colId && startInfo.index === finalIdx) {
      crossColMovedRef.current = false;
      return;
    }

    // 乐观更新（同步规范化 position，保持与后端一致）
    setCardsByColumn((prev) => {
      const list = [...(prev[colId!] || [])];
      const from = list.findIndex((c) => c.id === activeCardId);
      if (from < 0) return prev;
      const reordered = arrayMove(list, from, finalIdx);
      return { ...prev, [colId!]: reordered.map((c, i) => ({ ...c, columnId: colId!, position: i })) };
    });

    try {
      await retroApi.updateCard(activeCardId, { columnId: colId, position: finalIdx });
    } catch (error) {
      await fetchColumns();
      if (error instanceof Error) addToast('error', error.message);
    } finally {
      crossColMovedRef.current = false;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">{t('common.loading')}</div>
      </Layout>
    );
  }

  if (!board) {
    return (
      <Layout>
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <p className="text-sm mb-2">{t('retro.detail.notFound')}</p>
          <button onClick={() => router.push('/retro')} className="text-blue-500 hover:underline text-sm">{t('retro.detail.backToList')}</button>
        </div>
      </Layout>
    );
  }

  const participants = board.participants || [];
  const shownParticipants = participants.slice(0, 5);
  const extraParticipants = participants.length - shownParticipants.length;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* ENDED banner */}
        {isEnded && (
          <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1.5 text-center">
            {t('retro.detail.endedBanner')}
          </div>
        )}

        {/* Header Bar */}
        <div className="border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => router.push('/retro')} className="p-1 text-gray-400 hover:text-gray-700" title={t('retro.detail.back')}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            {editingTitle && isOwner ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(board.title); }
                  }}
                  className="text-base font-semibold border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditingTitle(false); setTitleDraft(board.title); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <h1
                className={`text-base font-semibold text-gray-800 truncate ${isOwner && !isEnded ? 'cursor-text hover:bg-gray-100 rounded px-1' : ''}`}
                onClick={() => { if (isOwner && !isEnded) { setEditingTitle(true); setTitleDraft(board.title); } }}
                title={isOwner && !isEnded ? t('retro.detail.clickEditTitle') : ''}
              >
                {board.title}
              </h1>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isEnded ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {isEnded ? t('retro.list.tabEnded') : t('retro.list.tabActive')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Participant avatar group */}
            <div className="relative">
              <button
                onClick={() => setShowRoster(!showRoster)}
                className="flex items-center -space-x-1.5 hover:opacity-80 transition-opacity"
              >
                {shownParticipants.map((p) => (
                  <div
                    key={p.userId}
                    title={p.name}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white ${getAvatarColor(p.userId)}`}
                  >
                    {getInitials(p.name)}
                  </div>
                ))}
                {extraParticipants > 0 && (
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold border-2 border-white">
                    +{extraParticipants}
                  </div>
                )}
              </button>
              {showRoster && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoster(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-700">{t('retro.detail.participants')} ({participants.length})</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {participants.map((p) => (
                        <div key={p.userId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(p.userId)}`}>
                            {getInitials(p.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400 truncate">{p.email}</p>
                          </div>
                          <span className="text-xs text-gray-400">{p.role === 'OWNER' ? t('retro.detail.host') : t('retro.detail.participating')}</span>
                          {isOwner && !isEnded && p.role !== 'OWNER' && (
                            <button onClick={() => handleRemoveParticipant(p.userId)} className="p-0.5 text-gray-400 hover:text-red-500" title={t('retro.detail.removeParticipant')}>
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Owner-only actions */}
            {isOwner && !isEnded && (
              <>
                <button
                  onClick={() => setShowInviteDialog(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {t('retro.detail.invite')}
                </button>
                <button
                  onClick={handleEndBoard}
                  className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600 hover:bg-red-100 transition-colors"
                >
                  {t('retro.detail.endBoard')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Board area */}
        <DndContext
          sensors={isEnded ? [] : sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveCard(null); lastDragEndRef.current = Date.now(); restoreAfterDragAbort(); }}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 h-full p-3 min-w-max">
              {columns.map((col) => {
                const colCards = cardsByColumn[col.id] || [];
                const voteSorted = voteSortCols.has(col.id);
                // 按票数排序：票数降序，同票按 position 升序保持稳定；默认按 position 顺序
                const displayCards = voteSorted
                  ? [...colCards].sort((a, b) => (b.votes - a.votes) || (a.position - b.position))
                  : colCards;
                const colItems = displayCards.map((c) => `card-${c.id}`);
                return (
                  <div
                    key={col.id}
                    className="w-72 bg-gray-50 rounded-lg flex flex-col flex-shrink-0"
                  >
                    {/* Column header */}
                    <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
                      {renamingColumnId === col.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={columnNameDraft}
                            onChange={(e) => setColumnNameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameColumn(col.id);
                              if (e.key === 'Escape') { setRenamingColumnId(null); }
                            }}
                            className="flex-1 text-sm font-medium border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-300"
                            autoFocus
                          />
                          <button onClick={() => handleRenameColumn(col.id)} className="p-0.5 text-green-600"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setRenamingColumnId(null)} className="p-0.5 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-700 truncate">{col.name}</span>
                          <span className="text-xs text-gray-400">({colCards.length})</span>
                        </div>
                      )}
                      {renamingColumnId !== col.id && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => toggleVoteSort(col.id)}
                            className={`p-0.5 ${voteSorted ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'}`}
                            title={voteSorted ? t('retro.detail.sortByVotesActive') : t('retro.detail.sortByVotes')}
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                          {!isEnded && isOwner && (
                            <>
                              <button onClick={() => { setRenamingColumnId(col.id); setColumnNameDraft(col.name); }} className="p-0.5 text-gray-400 hover:text-gray-700" title={t('retro.detail.renameColumn')}>
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteColumn(col.id)} className="p-0.5 text-gray-400 hover:text-red-500" title={t('common.delete')}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cards */}
                    <DroppableColumn id={`col-${col.id}`} disabled={voteSorted}>
                      <SortableContext items={colItems} strategy={verticalListSortingStrategy}>
                        {displayCards.map((card) => (
                          <SortableCard
                            key={card.id}
                            card={card}
                            isEnded={isEnded}
                            canEdit={isOwner || (!!user && card.creatorId === Number(user.id))}
                            sortLocked={voteSorted}
                            onVote={handleVote}
                            onEdit={setEditingCard}
                            onDelete={handleDeleteCard}
                            onOpen={handleOpenCard}
                          />
                        ))}
                      </SortableContext>
                      {/* Add card entry */}
                      {!isEnded && (
                        <div className="mt-2">
                          {addingCardColumnId === col.id ? (
                            <div className="bg-white border border-gray-200 rounded-lg p-2">
                              <textarea
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(col.id); }
                                  if (e.key === 'Escape') { setAddingCardColumnId(null); setNewCardTitle(''); }
                                }}
                                placeholder={t('retro.detail.cardTitlePlaceholder')}
                                rows={2}
                                className="w-full text-sm border-0 focus:outline-none resize-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <button onClick={() => { setAddingCardColumnId(null); setNewCardTitle(''); }} className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700">{t('common.cancel')}</button>
                                <button onClick={() => handleAddCard(col.id)} className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">{t('retro.detail.add')}</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingCardColumnId(col.id); setNewCardTitle(''); }}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded px-2 py-1 w-full transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              {t('retro.detail.addCard')}
                            </button>
                          )}
                        </div>
                      )}
                    </DroppableColumn>
                  </div>
                );
              })}

              {/* Add column (owner only, not ended) */}
              {isOwner && !isEnded && (
                <div className="w-72 flex-shrink-0">
                  {addingColumn ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddColumn();
                          if (e.key === 'Escape') { setAddingColumn(false); setNewColumnName(''); }
                        }}
                        placeholder={t('retro.detail.columnNamePlaceholder')}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <button onClick={() => { setAddingColumn(false); setNewColumnName(''); }} className="px-2 py-0.5 text-xs text-gray-500">{t('common.cancel')}</button>
                        <button onClick={handleAddColumn} className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">{t('retro.detail.addColumn')}</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingColumn(true)}
                      className="flex items-center justify-center gap-1 w-full py-2 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg border border-dashed border-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('retro.detail.addColumn')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeCard ? (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg rotate-2 opacity-90 w-64 h-36 flex flex-col">
                <p className="text-sm font-medium text-gray-800 flex-1 min-h-0 overflow-hidden break-words line-clamp-2">{activeCard.title}</p>
                {activeCard.description && (
                  <div className="flex-1 min-h-0 overflow-hidden mt-1">
                    <p className="text-xs text-gray-500 break-words whitespace-pre-wrap line-clamp-4">{activeCard.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-auto pt-2">
                  <ThumbsUp className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-700">{activeCard.votes}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Dialogs */}
      <CardEditDialog
        card={editingCard}
        readOnly={isEnded || (!!editingCard && !!user && editingCard.creatorId !== Number(user.id) && !isOwner)}
        onSave={handleSaveCard}
        onClose={() => setEditingCard(null)}
      />
      {showInviteDialog && board && (
        <InviteDialog
          boardId={board.id}
          currentParticipantIds={participants.map((p) => p.userId)}
          users={users}
          onInvited={fetchBoard}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </Layout>
  );
}

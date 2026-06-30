'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Column from '../../components/board/Column';
import { boardApi, columnApi, cardApi, teamApi } from '../../services/api';
import { Card as CardType, ColumnType, Board } from '../../types';
import useBoardWebSocket from '../../hooks/useBoardWebSocket';

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;
  const { t } = useTranslation('common');
  
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id?: number; username?: string; email?: string }[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Track which cards the current user has voted for (local source of truth for WebSocket merges)
  const votedCardIdsRef = useRef<Set<number>>(new Set());
  
  // Merge incoming card data with our local voted state
  const mergeCardWithLocalVotedState = useCallback((card: CardType): CardType => {
    return {
      ...card,
      votedByCurrentUser: votedCardIdsRef.current.has(card.id),
    };
  }, []);
  
  // WebSocket event handlers with useCallback to prevent re-subscriptions
  const handleCardCreated = useCallback((card: CardType) => {
    console.log('handleCardCreated: called with card:', card);
    const mergedCard = mergeCardWithLocalVotedState(card);
    setColumns(prev => prev.map(col => 
      col.id === card.column.id 
        ? { 
            ...col, 
            cards: col.cards.some(c => c.id === mergedCard.id) 
              ? col.cards 
              : [...col.cards, mergedCard] 
          } 
        : col
    ));
  }, [mergeCardWithLocalVotedState]);
  
  const handleCardUpdated = useCallback((card: CardType) => {
    console.log('handleCardUpdated: called with card:', card);
    console.log('handleCardUpdated: card.column:', card.column);
    const mergedCard = mergeCardWithLocalVotedState(card);
    setColumns(prev => {
      console.log('handleCardUpdated: current columns:', prev);
      
      // First, remove the card from all columns
      const columnsWithoutCard = prev.map(col => ({
        ...col,
        cards: col.cards.filter(c => c.id !== mergedCard.id)
      }));
      
      // Then, add the card to the new column at the correct position
      const newColumns = columnsWithoutCard.map(col => {
        if (col.id === mergedCard.column?.id) {
          console.log('handleCardUpdated: adding card to column', col.id, 'at position', mergedCard.position);
          // Create a new array with the card inserted at the correct position
          const newCards = [...col.cards];
          newCards.splice(mergedCard.position, 0, mergedCard);
          return {
            ...col,
            cards: newCards
          };
        }
        return col;
      });
      
      console.log('handleCardUpdated: new columns:', newColumns);
      return newColumns;
    });
  }, [mergeCardWithLocalVotedState]);
  
  const handleCardDeleted = useCallback((cardId: number) => {
    // Clean up voted tracking set when card is deleted
    votedCardIdsRef.current.delete(cardId);
    setColumns(prev => prev.map(col => 
      ({ ...col, cards: col.cards.filter(c => c.id !== cardId) })
    ));
  }, []);
  
  const handleColumnCreated = useCallback((column: ColumnType) => {
    setColumns(prev => {
      // Check if column already exists to prevent duplicates
      const columnExists = prev.some(col => col.id === column.id);
      if (columnExists) {
        console.log('handleColumnCreated: Column already exists, skipping:', column.id);
        return prev;
      }
      console.log('handleColumnCreated: Adding new column:', column);
      return [...prev, { ...column, cards: [] }];
    });
  }, []);
  
  const handleColumnUpdated = useCallback((column: ColumnType) => {
    setColumns(prev => prev.map(col => 
      col.id === column.id ? { ...column, cards: col.cards } : col
    ));
  }, []);
  
  const handleColumnDeleted = useCallback((columnId: number) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
  }, []);
  
  // Connect to WebSocket
  useBoardWebSocket({
    boardId: parseInt(boardId),
    onCardCreated: handleCardCreated,
    onCardUpdated: handleCardUpdated,
    onCardDeleted: handleCardDeleted,
    onCardVoted: handleCardUpdated, // Use same handler as card updated
    onColumnCreated: handleColumnCreated,
    onColumnUpdated: handleColumnUpdated,
    onColumnDeleted: handleColumnDeleted
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch board details and columns
    fetchBoardData();
  }, [router, boardId]);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch board details
      const boardData = await boardApi.getBoardById(parseInt(boardId));
      setBoard(boardData);

      // Fetch team members for the board
      try {
        if (boardData && boardData.team && boardData.team.id) {
          const members = await teamApi.getTeamMembers(boardData.team.id);
          setTeamMembers(Array.isArray(members) ? members : []);
        } else {
          setTeamMembers([]);
        }
      } catch (membersErr) {
        console.error('Error fetching team members:', membersErr);
        setTeamMembers([]);
      }
      
      // Fetch columns for the board
      const columnsData = await columnApi.getAllColumns(parseInt(boardId));
      
      // For each column, fetch its cards
      const columnsWithCards = await Promise.all(
        columnsData.map(async (column) => {
          const cardsData = await cardApi.getAllCards(column.id);
          return {
            ...column,
            cards: cardsData,
          };
        })
      );
      
      // Initialize local voted tracking set from the API data (which has correct per-user state)
      const newVotedSet = new Set<number>();
      columnsWithCards.forEach(col => {
        col.cards.forEach((c: CardType) => {
          if (c.votedByCurrentUser) {
            newVotedSet.add(c.id);
          }
        });
      });
      votedCardIdsRef.current = newVotedSet;
      
      // Sort columns by position
      columnsWithCards.sort((a, b) => a.position - b.position);
      setColumns(columnsWithCards);
    } catch (error) {
      console.error('Error fetching board data:', error);
      setIsError(true);
      setErrorMessage('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (columnId: number, cardData: { description: string }) => {
    try {
      // Get the column to determine the next position
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      const newPosition = column.cards.length;
      
      // Create the card using the API
      await cardApi.createCard({
        description: cardData.description,
        columnId,
        position: newPosition,
      });
      
      // Local state update is no longer needed as WebSocket event will handle it
      // This prevents duplicate cards from appearing
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Failed to add card');
    }
  };

  const handleUpdateCard = async (columnId: number, cardId: number, updatedCard: Partial<CardType>) => {
    try {
      // Get the current card
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      const card = column.cards.find(c => c.id === cardId);
      if (!card) return;
      
      // Update the local voted tracking ref if votedByCurrentUser is in the update payload
      if (updatedCard.votedByCurrentUser !== undefined) {
        if (updatedCard.votedByCurrentUser) {
          votedCardIdsRef.current.add(cardId);
        } else {
          votedCardIdsRef.current.delete(cardId);
        }
      }
      
      // Update the card using the API
      await cardApi.updateCard(cardId, {
        description: updatedCard.description || card.description,
        columnId,
        position: card.position,
      });
      
      // Update the local state - apply votedByCurrentUser from our tracking ref for correctness
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cards: column.cards.map((c) =>
                  c.id === cardId
                    ? { ...c, ...updatedCard, votedByCurrentUser: votedCardIdsRef.current.has(cardId) }
                    : c
                ),
              }
            : column
        )
      );
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card');
    }
  };

  const handleDeleteCard = async (columnId: number, cardId: number) => {
    try {
      // Delete the card using the API
      await cardApi.deleteCard(cardId);
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId),
              }
            : column
        )
      );
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card');
    }
  };

  const handleAddColumn = async (title: string) => {
    try {
      // Get the next position
      const newPosition = columns.length;
      
      // Create the column using the API
      await columnApi.createColumn({
        name: title,
        boardId: parseInt(boardId),
        position: newPosition,
      });
      
      // Local state update is no longer needed as WebSocket event will handle it
      // This prevents duplicate columns from appearing
    } catch (error) {
      console.error('Error adding column:', error);
      alert('Failed to add column');
    }
  };

  const handleUpdateColumn = async (columnId: number, updatedColumn: Partial<ColumnType>) => {
    try {
      // Get the current column
      const column = columns.find(col => col.id === columnId);
      if (!column) return;
      
      // Update the column using the API
      await columnApi.updateColumn(columnId, {
        name: updatedColumn.name || column.name,
        position: column.position,
      });
      
      // Update the local state
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId ? { ...column, ...updatedColumn } : column
        )
      );
    } catch (error) {
      console.error('Error updating column:', error);
      alert('Failed to update column');
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      // Delete the column using the API
      await columnApi.deleteColumn(columnId);
      
      // Update the local state
      setColumns((prevColumns) => prevColumns.filter((column) => column.id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Failed to delete column');
    }
  };

  const handleMoveCard = async (fromColumnId: number, toColumnId: number, cardId: number, dropIndex: number | null = null) => {
    try {
      // --- Phase 1: capture pre-mutation data + compute final deterministic layout ---
      const fromColumn = columns.find(col => col.id === fromColumnId);
      const toColumn = columns.find(col => col.id === toColumnId);
      if (!fromColumn || !toColumn) return;

      const movedCardSnapshot = fromColumn.cards.find(c => c.id === cardId);
      if (!movedCardSnapshot) return;

      // Clone so we never mutate the live React state during layout computation
      const cloneCard = (c: CardType): CardType => ({ ...c, column: c.column ? { ...c.column } : null as any });
      let sourceCards = fromColumn.cards.map(cloneCard);
      let targetCards = (fromColumnId === toColumnId)
        ? sourceCards                                       // same column: source/target share the array
        : toColumn.cards.map(cloneCard);

      // 1. Remove moved card from source cards
      const removalIdx = sourceCards.findIndex(c => c.id === cardId);
      if (removalIdx === -1) return;
      const [movedCard] = sourceCards.splice(removalIdx, 1);
      // (If same-column, targetCards is same ref as sourceCards → already reflects removal)
      if (fromColumnId === toColumnId) {
        targetCards = sourceCards;
      }

      // 2. Renumber source positions to [0..sourceLen-1] (clean slate — no sparse numbers)
      sourceCards.forEach((c, i) => { c.position = i; });

      // 3. Compute insertSlot into target cards (targetCards already has post-removal length N if same-column)
      const targetLen = targetCards.length;
      let insertSlot: number;
      if (dropIndex == null) {
        insertSlot = targetLen;                                   // no indicator → append
      } else {
        insertSlot = Math.max(0, Math.min(targetLen, dropIndex)); // clamp [0..targetLen]
      }

      // 4. Sort target cards by position ASC (matches Column.tsx default sortedCards + visual DOM order)
      const targetSorted = [...targetCards].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      // 5. Insert movedCard at exact visual slot we were dropped into
      targetSorted.splice(insertSlot, 0, movedCard);

      // 6. Renumber target positions [0..targetLen] so insertSlot == movedCard.position always
      targetSorted.forEach((c, i) => { c.position = i; });

      // Final position we'll tell the API
      const finalMovedPosition = insertSlot;

      // Cross-column: update the moved card's embedded column reference
      const finalColumnRef = { id: toColumnId, name: toColumn.name };
      if (fromColumnId !== toColumnId) {
        movedCard.column = finalColumnRef;
      } else if (!movedCard.column || movedCard.column.id !== toColumnId) {
        movedCard.column = finalColumnRef;
      }

      // --- Phase 2: commit to local state first (fast animation) ---
      setColumns(prev => {
        const updatedColumns = prev.map(col => ({ ...col, cards: [...col.cards] }));

        // Write back renumbered source cards (same for both cross-column and same-column)
        const newSource = updatedColumns.find(col => col.id === fromColumnId);
        if (newSource) {
          if (fromColumnId === toColumnId) {
            // Same-column: targetSorted contains full final list (post-removal + insert)
            newSource.cards = targetSorted.map(cloneCard);
          } else {
            newSource.cards = sourceCards.map(cloneCard);
          }
        }

        // Cross-column: write back renumbered target list separately
        if (fromColumnId !== toColumnId) {
          const newTarget = updatedColumns.find(col => col.id === toColumnId);
          if (newTarget) {
            newTarget.cards = targetSorted.map(cloneCard);
          }
        }

        return updatedColumns;
      });

      // --- Phase 3: persist via API (bulk parallel writes, derived from our precomputed clean arrays) ---
      const movedPatch = {
        description: movedCard.description,
        columnId: toColumnId,
        position: finalMovedPosition,
      };
      await cardApi.updateCard(cardId, movedPatch);

      // Build {cardId -> newPosition} lookups for neighbor position writes
      const sourcePosById = new Map<number, number>();
      sourceCards.forEach(c => { if (c.id !== cardId) sourcePosById.set(c.id, c.position); });

      const targetPosById = new Map<number, number>();
      targetSorted.forEach(c => { targetPosById.set(c.id, c.position); });

      const neighborPatches: Array<Promise<void>> = [];

      // Source neighbors (after removal + renumber). Cross-column only: if same-column, target writes cover it.
      if (fromColumnId !== toColumnId) {
        sourceCards.forEach(c => {
          if (c.id === cardId) return;
          neighborPatches.push(
            cardApi.updateCard(c.id, {
              description: c.description,
              columnId: fromColumnId,
              position: sourcePosById.get(c.id) ?? c.position,
            }).then(() => undefined)
          );
        });
      }

      // Target neighbors (after insert + renumber) — includes movedCard already written above; skip it
      targetSorted.forEach(c => {
        if (c.id === cardId) return;
        neighborPatches.push(
          cardApi.updateCard(c.id, {
            description: c.description,
            columnId: toColumnId,
            position: targetPosById.get(c.id) ?? c.position,
          }).then(() => undefined)
        );
      });

      await Promise.all(neighborPatches);
    } catch (error) {
      console.error('Error moving card:', error);
      alert('Failed to move card');
    }
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-neutral-100 dark:bg-gray-900 flex">
        {isMobileSidebarOpen && (
          <Sidebar 
            isMobile={true}
            onMobileToggle={handleMobileSidebarToggle}
          />
        )}
        <Sidebar 
          isMobile={false}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden px-3 pt-2 pb-0 shrink-0">
            <button 
              onClick={handleMobileSidebarToggle}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 p-4 pt-2 md:pt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const AVATAR_PALETTE = [
    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  ];

  const getMemberColorClassesByKey = (stringKey: string) => {
    const key = String(stringKey ?? '');
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  };

  const getNestedUser = (member: any) =>
    member?.user ?? (member?.username || member?.id ? member : null);

  const getMemberDisplayName = (member: any): string => {
    const user = getNestedUser(member);
    return (
      (user?.username && String(user.username).trim()) ||
      (typeof user?.email === 'string' && user.email.split('@')[0]) ||
      ''
    );
  };

  const getInitials = (displayName: string): string => {
    const normalized = String(displayName ?? '')
      .trim()
      .replace(/[\s._\-+,;:@=|/\\]+/g, ' ')
      .trim();
    if (!normalized) return '?';
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return '?';
    if (tokens.length === 1) {
      const single = tokens[0];
      if (!single) return '?';
      return single.slice(0, Math.min(2, single.length)).toUpperCase();
    }
    const first = tokens[0].charAt(0);
    const last = tokens[tokens.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  const getMemberColorKey = (member: any): string => {
    const user = getNestedUser(member);
    if (user?.id != null) return `user:${String(user.id)}`;
    const display = getMemberDisplayName(member);
    if (display) return `name:${display}`;
    if (member?.id != null) return `member:${String(member.id)}`;
    return 'anon';
  };

  const getMemberTooltip = (member: any): string => {
    const user = getNestedUser(member);
    const name = user?.username;
    const email = user?.email;
    if (name && email) return `${name}  ·  ${email}`;
    if (name) return String(name);
    if (email) return String(email);
    return 'Team Member';
  };

  const MAX_AVATARS = 4;
  const visibleMembers = teamMembers.slice(0, MAX_AVATARS);
  const overflowCount = Math.max(0, teamMembers.length - MAX_AVATARS);

  if (isError || !board) {
    return (
      <div className="h-screen bg-neutral-100 dark:bg-gray-900 flex">
        {isMobileSidebarOpen && (
          <Sidebar 
            isMobile={true}
            onMobileToggle={handleMobileSidebarToggle}
          />
        )}
        <Sidebar 
          isMobile={false}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden px-3 pt-2 pb-0 shrink-0">
            <button 
              onClick={handleMobileSidebarToggle}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-center min-h-0 p-4 pt-2 md:pt-4">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-neutral-400 mb-6">{errorMessage || 'Failed to load board'}</p>
              <button
                onClick={fetchBoardData}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-100 dark:bg-gray-900 flex">
      {isMobileSidebarOpen && (
        <Sidebar 
          isMobile={true}
          onMobileToggle={handleMobileSidebarToggle}
        />
      )}
      <Sidebar 
        isMobile={false}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden px-3 pt-2 pb-0 shrink-0">
          <button 
            onClick={handleMobileSidebarToggle}
            className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 p-4 pt-2 md:pt-4 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <button 
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
                onClick={() => router.back()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-medium">{board.name}</h1>
                <p className="text-neutral-400 text-sm">{board.description || t('board.noDescription')}</p>
              </div>
            </div>
            <div className="flex items-center -space-x-2">
              {visibleMembers.map((member, idx) => {
                const user = getNestedUser(member);
                const displayName = getMemberDisplayName(member);
                const initial = getInitials(displayName);
                const colorKey = getMemberColorKey(member);
                const listKey =
                  user?.id != null
                    ? `user-${String(user.id)}`
                    : `member-${member?.id ?? idx}`;
                const colorClasses = getMemberColorClassesByKey(colorKey);
                const tooltip = getMemberTooltip(member);
                return (
                  <div
                    key={listKey}
                    title={tooltip}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-2 ring-white dark:ring-gray-900 border border-white/60 dark:border-gray-900/60 ${colorClasses}`}
                    style={{ zIndex: 10 - idx }}
                  >
                    {initial}
                  </div>
                );
              })}
              {overflowCount > 0 && (
                <div
                  title={`${overflowCount} more team member${overflowCount === 1 ? '' : 's'}`}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-2 ring-white dark:ring-gray-900 border border-white/60 dark:border-gray-900/60 bg-neutral-100 text-neutral-500 dark:bg-gray-700 dark:text-neutral-200"
                  style={{ zIndex: 1 }}
                >
                  +{overflowCount}
                </div>
              )}
              {teamMembers.length === 0 && (
                <div className="text-xs text-neutral-400 italic">
                  {t('board.teamMembers')}: 0
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="flex gap-4 overflow-x-auto pb-3 min-h-full">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onUpdateCard={handleUpdateCard}
                  onDeleteCard={handleDeleteCard}
                  onUpdateColumn={handleUpdateColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onMoveCard={handleMoveCard}
                />
              ))}
              <button 
                onClick={() => {
                  // Create new column with default values
                  const newColumnTitle = `Column ${columns.length + 1}`;
                  handleAddColumn(newColumnTitle);
                }}
                className="w-[320px] flex-shrink-0 bg-white/50 dark:bg-gray-700/50 border-2 border-dashed border-neutral-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 hover:border-primary transition-all duration-200"
                title={t('board.addColumn')}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
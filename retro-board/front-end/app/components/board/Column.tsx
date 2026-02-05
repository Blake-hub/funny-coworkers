'use client';

import { useState, useRef, useEffect } from 'react';
import Card from '../card/Card';

interface Card {
  id: number;
  title: string;
  content: string;
  creator: string;
  createdAt: string;
  votes: number;
}

interface ColumnType {
  id: number;
  title: string;
  description: string;
  cards: Card[];
}

interface ColumnProps {
  column: ColumnType;
  onAddCard: (columnId: number, card: Card) => void;
  onUpdateCard: (columnId: number, cardId: number, updatedCard: Partial<Card>) => void;
  onDeleteCard: (columnId: number, cardId: number) => void;
  onUpdateColumn: (columnId: number, updatedColumn: Partial<ColumnType>) => void;
  onDeleteColumn: (columnId: number) => void;
  onMoveCard?: (fromColumnId: number, toColumnId: number, cardId: number, dropIndex?: number | null) => void;
}

export type SortCriteria = 'votes' | 'creator' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export default function Column({ 
  column, 
  onAddCard, 
  onUpdateCard, 
  onDeleteCard, 
  onUpdateColumn, 
  onDeleteColumn,
  onMoveCard
}: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardContent, setNewCardContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [editDescription, setEditDescription] = useState(column.description);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('votes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      const newCard: Card = {
        id: Date.now(),
        title: newCardTitle,
        content: newCardContent,
        creator: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        votes: 0,
      };
      onAddCard(column.id, newCard);
      setNewCardTitle('');
      setNewCardContent('');
      setErrorMessage('');
      setIsAddingCard(false);
    } else {
      setErrorMessage('Title is required');
    }
  };

  const handleEditColumn = () => {
    setIsEditing(true);
  };

  const handleSaveColumn = () => {
    if (editTitle.trim()) {
      onUpdateColumn(column.id, {
        title: editTitle,
        description: editDescription,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(column.title);
    setEditDescription(column.description);
    setIsEditing(false);
  };

  // Sort cards based on current criteria and direction
  const sortedCards = [...column.cards].sort((a, b) => {
    let comparison = 0;
    
    switch (sortCriteria) {
      case 'votes':
        comparison = a.votes - b.votes;
        break;
      case 'creator':
        comparison = a.creator.localeCompare(b.creator);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sort criteria change
  const handleSortChange = (criteria: SortCriteria) => {
    if (criteria === sortCriteria) {
      // Toggle direction if same criteria
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new criteria with default direction
      setSortCriteria(criteria);
      // Default direction based on criteria
      setSortDirection(criteria === 'votes' ? 'desc' : 'asc');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sortButton = event.target as HTMLElement;
      if (isSortDropdownOpen && !sortButton.closest('.relative')) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  const handleDeleteColumn = () => {
    if (confirm('Are you sure you want to delete this column?')) {
      onDeleteColumn(column.id);
    }
  };

  return (
    <div className="min-w-[300px] bg-neutral-200 dark:bg-gray-800 rounded-lg p-4 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        {isEditing ? (
          <div className="flex-1 pr-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field w-full text-sm mb-2"
              placeholder="Column title"
            />
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="input-field w-full text-xs"
              placeholder="Column description"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveColumn}
                className="btn-primary text-xs flex-1"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-neutral-500">{column.title}</h3>
            <p className="text-xs text-neutral-400">{column.description}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="bg-neutral-300 text-neutral-500 text-xs font-medium px-2 py-1 rounded-full">
            {column.cards.length}
          </span>
          {!isEditing && (
            <div className="flex items-center gap-1">
              {/* Sort dropdown */}
              <div className="relative">
                <button 
                  className="p-1 rounded hover:bg-neutral-300 transition-smooth flex items-center gap-1"
                  title="Sort cards"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="text-xs text-neutral-400">
                    {sortCriteria === 'votes' ? 'Votes' : 
                     sortCriteria === 'creator' ? 'Creator' : 'Date'}
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                    <button
                      onClick={() => {
                        handleSortChange('votes');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm ${sortCriteria === 'votes' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-gray-600'}`}
                    >
                      Votes {sortCriteria === 'votes' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => {
                        handleSortChange('creator');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm ${sortCriteria === 'creator' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-gray-600'}`}
                    >
                      Creator {sortCriteria === 'creator' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => {
                        handleSortChange('createdAt');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm ${sortCriteria === 'createdAt' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-gray-600'}`}
                    >
                      Date {sortCriteria === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={handleEditColumn}
                className="p-1 rounded hover:bg-neutral-300 transition-smooth"
                title="Edit column"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={handleDeleteColumn}
                className="p-1 rounded hover:bg-neutral-300 transition-smooth"
                title="Delete column"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <div 
        ref={columnRef}
        className={`flex-1 space-y-2 mb-4 overflow-y-auto max-h-[500px] transition-all duration-200 ${isDragOver ? 'bg-primary/10 border-2 border-primary rounded-lg p-2' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          // Clear any existing timeout
          if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
          }
          // Set drag over state immediately
          setIsDragOver(true);
          
          // Calculate drop position based on mouse location
          if (columnRef.current) {
            const rect = columnRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const cardElements = columnRef.current.querySelectorAll('.card-container');
            
            let closestIndex = column.cards.length;
            let minDistance = Infinity;
            
            if (cardElements.length > 0) {
              cardElements.forEach((cardEl, index) => {
                const cardRect = cardEl.getBoundingClientRect();
                const cardTop = cardRect.top - rect.top;
                const cardBottom = cardTop + cardRect.height;
                const cardMiddle = (cardTop + cardBottom) / 2;
                
                // Calculate candidate drop index and distance based on mouse position
                let candidateIndex: number;
                let candidateDistance: number;
                
                if (y < cardMiddle) {
                  // Drop before this card
                  candidateIndex = index;
                  candidateDistance = Math.abs(y - cardTop);
                } else {
                  // Drop after this card
                  candidateIndex = index + 1;
                  candidateDistance = Math.abs(y - cardBottom);
                }
                
                // Update closest index if this candidate is closer
                if (candidateDistance < minDistance) {
                  minDistance = candidateDistance;
                  closestIndex = candidateIndex;
                }
              });
              
              // Check if mouse is below the last card
              const lastCardEl = cardElements[cardElements.length - 1];
              const lastCardRect = lastCardEl.getBoundingClientRect();
              const lastCardBottom = lastCardRect.top - rect.top + lastCardRect.height;
              
              const bottomDistance = Math.abs(y - lastCardBottom);
              if (y > lastCardBottom && bottomDistance < minDistance) {
                closestIndex = column.cards.length;
              }
            }
            
            setDropIndex(closestIndex);
          }
        }}
        onDragLeave={(e) => {
          // Only set isDragOver to false if the mouse is actually leaving the column
          // This prevents flickering when moving over child elements
          if (e.currentTarget && e.relatedTarget) {
            const currentTarget = e.currentTarget as HTMLElement;
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!currentTarget.contains(relatedTarget)) {
              // Clear any existing timeout
              if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
              }
              // Add a small delay to prevent flickering
              dragTimeoutRef.current = setTimeout(() => {
                setIsDragOver(false);
                setDropIndex(null);
              }, 50);
            }
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          // Clear any existing timeout
          if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
          }
          
          const data = e.dataTransfer.getData('text/plain');
          if (data) {
            const [fromColumnId, cardId] = data.split(',').map(Number);
            if (onMoveCard) {
              onMoveCard(fromColumnId, column.id, cardId, dropIndex);
            }
          }
          
          setIsDragOver(false);
          setDropIndex(null);
        }}
      >
        {sortedCards.map((card, index) => (
          <div key={card.id}>
            {dropIndex === index && (
              <div className="h-1 bg-primary rounded-full my-1 transition-all duration-200"></div>
            )}
            <Card
              card={card}
              columnId={column.id}
              onUpdate={(updatedCard) => onUpdateCard(column.id, card.id, updatedCard)}
              onDelete={() => onDeleteCard(column.id, card.id)}
            />
          </div>
        ))}
        {dropIndex === sortedCards.length && (
          <div className="h-1 bg-primary rounded-full my-1 transition-all duration-200"></div>
        )}
      </div>
      {isAddingCard ? (
        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 space-y-2">
          <input
            type="text"
            placeholder="Card title"
            className="input-field w-full text-sm"
            value={newCardTitle}
            onChange={(e) => {
              setNewCardTitle(e.target.value);
              // Clear error when user starts typing
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
          />
          <textarea
            placeholder="Card content"
            className="input-field w-full text-sm h-20 resize-none"
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
          />
          {errorMessage && (
            <div className="text-xs text-error">
              {errorMessage}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="btn-primary text-xs flex-1"
            >
              Add Card
            </button>
            <button
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
                setNewCardContent('');
                setErrorMessage('');
              }}
              className="btn-outline text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsAddingCard(true);
            setNewCardTitle('');
            setNewCardContent('');
            setErrorMessage('');
          }}
          className="w-full text-left p-2 rounded-lg hover:bg-neutral-300 transition-smooth text-sm text-neutral-500"
        >
          + Add Card
        </button>
      )}
    </div>
  );
}
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Card from '../card/Card';
import { cardApi } from '../../services/api';
import { Card as CardType, ColumnType } from '../../types';

interface ColumnProps {
  column: ColumnType;
  onAddCard: (columnId: number, card: { title: string; description: string }) => void;
  onUpdateCard: (columnId: number, cardId: number, updatedCard: Partial<CardType>) => void;
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
  const [editTitle, setEditTitle] = useState(column.name);
  const [sortCriteria, setSortCriteria] = useState<'createdAt' | 'votes'>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, {
        title: newCardTitle,
        description: newCardContent,
      });
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
        name: editTitle,
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(column.name);
    setIsEditing(false);
  };

  // Sort cards based on current criteria and direction
  const sortedCards = [...column.cards].sort((a, b) => {
    let comparison = 0;
    
    switch (sortCriteria) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'votes':
        comparison = b.votes - a.votes; // Default to descending for votes
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sort criteria change
  const handleSortChange = (criteria: 'createdAt' | 'votes') => {
    if (criteria === sortCriteria) {
      // Toggle direction if same criteria
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new criteria with default direction
      setSortCriteria(criteria);
      // Default direction: votes default to desc, others to asc
      setSortDirection(criteria === 'votes' ? 'desc' : 'asc');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSortDropdownOpen && !target.closest('.relative')) {
        setIsSortDropdownOpen(false);
      }
      if (isActionDropdownOpen && !target.closest('.relative')) {
        setIsActionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen, isActionDropdownOpen]);

  const handleDeleteColumn = () => {
    if (confirm('Are you sure you want to delete this column?')) {
      onDeleteColumn(column.id);
    }
  };

  return (
    <div className="w-[320px] bg-neutral-200 dark:bg-gray-800 rounded-xl p-5 flex flex-col transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between mb-5 h-16">
        {isEditing ? (
          <div className="flex-1 pr-4 flex flex-col justify-between h-full">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-field w-full text-base py-2"
              placeholder="Column title"
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleSaveColumn}
                className="btn-primary text-sm flex-1 py-1.5 transition-all duration-300 transform hover:scale-105"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="btn-outline text-sm py-1.5 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 mr-4 flex items-center h-full overflow-hidden">
            <h3 className="font-medium text-neutral-600 dark:text-neutral-300 text-lg truncate">{column.name}</h3>
          </div>
        )}
        <div className="flex items-center gap-2 h-full">
          <span className="bg-neutral-300 dark:bg-gray-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium px-3 py-1.5 rounded-full">
            {column.cards.length}
          </span>
          {!isEditing && (
            <div className="flex items-center gap-1">
              {/* Sort dropdown - icon only */}
              <div className="relative">
                <button 
                  className="p-1.5 rounded-full hover:bg-neutral-300 dark:hover:bg-gray-700 transition-all duration-300"
                  title={`Sort by ${sortCriteria === 'votes' ? 'Votes' : 'Date'} ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>
                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[130px] transform transition-all duration-300 animate-scale-in">
                    <button
                      onClick={() => {
                        handleSortChange('createdAt');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${sortCriteria === 'createdAt' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-gray-600'}`}
                    >
                      Date {sortCriteria === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => {
                        handleSortChange('votes');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${sortCriteria === 'votes' ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-gray-600'}`}
                    >
                      Votes {sortCriteria === 'votes' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                )}
              </div>
              {/* Actions dropdown */}
              <div className="relative">
                <button 
                  className="p-1.5 rounded-full hover:bg-neutral-300 dark:hover:bg-gray-700 transition-all duration-300"
                  title="Column actions"
                  onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {isActionDropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[120px] transform transition-all duration-300 animate-scale-in">
                    <button
                      onClick={() => {
                        handleEditColumn();
                        setIsActionDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteColumn();
                        setIsActionDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div 
        ref={columnRef}
        className={`flex-1 mb-5 overflow-y-auto transition-all duration-200 ${isDragOver ? 'bg-primary/10 border-2 border-primary rounded-lg p-3' : ''}`}
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
            
            let closestIndex = sortedCards.length;
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
                closestIndex = sortedCards.length;
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
        <div className="space-y-3">
          {sortedCards.map((card, index) => (
            <div 
              key={card.id} 
              className="transition-all duration-1000 ease-in-out transform"
              style={{ transitionProperty: 'transform, opacity', transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
            >
              {dropIndex === index && (
                <div className="h-1.5 bg-primary rounded-full my-1.5 transition-all duration-300"></div>
              )}
              <Card
                card={card}
                columnId={column.id}
                onUpdate={(updatedCard) => onUpdateCard(column.id, card.id, updatedCard)}
                onDelete={() => onDeleteCard(column.id, card.id)}
                onVote={async () => {
                  try {
                    const updatedCard = await cardApi.voteCard(card.id);
                    onUpdateCard(column.id, card.id, updatedCard);
                  } catch (err) {
                    console.error('Failed to vote:', err);
                  }
                }}
              />
            </div>
          ))}
          {dropIndex === sortedCards.length && (
            <div className="h-1.5 bg-primary rounded-full my-1.5 transition-all duration-300"></div>
          )}
        </div>
      </div>
      {isAddingCard ? (
        <div className="bg-white dark:bg-gray-700 rounded-xl p-4 space-y-3 shadow-sm">
          <input
            type="text"
            placeholder="Card title"
            className="input-field w-full text-sm py-3"
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
            className="input-field w-full text-sm h-24 resize-none py-3"
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
          />
          {errorMessage && (
            <div className="text-xs text-red-500 font-medium">
              {errorMessage}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAddCard}
              className="btn-primary text-sm flex-1 py-3 transition-all duration-300 transform hover:scale-105"
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
              className="btn-outline text-sm py-3 transition-all duration-300"
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
          className="w-full text-left p-3 rounded-xl hover:bg-neutral-300 dark:hover:bg-gray-700 transition-all duration-300 text-sm text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      )}
    </div>
  );
}
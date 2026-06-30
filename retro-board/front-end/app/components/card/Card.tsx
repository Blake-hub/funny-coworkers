'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card as CardType } from '../../types';

interface CardProps {
  card: CardType;
  columnId: number;
  onUpdate: (updatedCard: Partial<CardType>) => void;
  onDelete: () => void;
  onVote: () => void;
}

export default function Card({ card, columnId, onUpdate, onDelete, onVote }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(card.description);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    onUpdate({ description: editedContent });
    setIsEditing(false);
    setIsDetailOpen(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete();
    }
  };

  return (
    <>
      {isEditing ? (
        <div
          className="rounded-xl p-5 shadow-lg ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 bg-white dark:bg-gray-700 max-w-full flex flex-col"
          style={{ minHeight: '180px' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Editing Card
            </span>
          </div>
          <div className="space-y-3 flex-1">
            <textarea
              className="input-field w-full text-sm h-40 resize-none py-3"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Card content"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className="btn-primary text-sm flex-1 py-3 transition-all duration-300 transform hover:scale-105"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(card.description);
                }}
                className="btn-outline text-sm py-3 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`card-container group relative cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'opacity-50' : ''}`}
          onClick={() => setIsDetailOpen(true)}
          draggable="true"
          ref={cardRef}
          onDragStart={(e) => {
            setIsDragging(true);
            e.dataTransfer.setData('text/plain', `${columnId},${card.id}`);
            e.dataTransfer.effectAllowed = 'move';
            
            if (e.clientX && e.clientY) {
              setDragPosition({ x: e.clientX, y: e.clientY });
            }
            
            if (e.currentTarget) {
              const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
              dragImage.style.width = '280px';
              dragImage.style.height = 'auto';
              dragImage.style.opacity = '0.9';
              dragImage.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
              dragImage.style.pointerEvents = 'none';
              e.dataTransfer.setDragImage(dragImage, 50, 50);
            }
            
            const handleDragOver = (dragEvent: DragEvent) => {
              if (dragEvent.clientX && dragEvent.clientY) {
                setDragPosition({ x: dragEvent.clientX, y: dragEvent.clientY });
              }
            };
            
            document.addEventListener('dragover', handleDragOver);
            
            const handleDragEnd = () => {
              document.removeEventListener('dragover', handleDragOver);
            };
            
            e.currentTarget.addEventListener('dragend', handleDragEnd, { once: true });
          }}
          onDragEnd={() => {
            setIsDragging(false);
          }}
        >
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-sm hover:bg-neutral-200 dark:hover:bg-gray-600 transition-all duration-200"
                aria-label="Edit card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-1.5 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm shadow-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
                aria-label="Delete card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-600 dark:text-neutral-300 hover:text-red-500 dark:hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          <div className="flex-1 overflow-hidden mb-2">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed h-full whitespace-pre-wrap break-words">
              {card.description || 'No content'}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVote();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 transform ${
                card.votedByCurrentUser
                  ? 'bg-green-500 dark:bg-green-600 text-white shadow-md hover:bg-green-600 dark:hover:bg-green-700 scale-105'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105'
              }`}
              aria-label={card.votedByCurrentUser ? 'Remove vote from card' : 'Vote for card'}
            >
              {card.votedByCurrentUser ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 10.5C2 9.673 2.673 9 3.5 9h1C4.327 9 5 9.673 5 10.5v9c0 .827-.673 1.5-1.5 1.5h-1C2.673 21 2 20.327 2 19.5v-9zM7 10.291V20c0 .438.094.855.265 1.238L7.494 21h6.606c.441 0 .853-.18 1.147-.495l5.249-5.643A2 2 0 0 0 20 13.459V13a2 2 0 0 0-2-2h-5.586l.919-4.594C13.455 5.56 12.825 4.5 11.866 4.5L11.5 4.5l-2 5-.395.987A2 2 0 0 0 9 11.5h1L7 11.5c0-.424.105-.828.291-1.189L7 10.291z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              )}
              <span className="font-semibold">{card.votes}</span>
            </button>
          </div>
        </div>
      )}

      {isDragging && !isEditing && createPortal(
        <div 
          className="fixed top-0 left-0 pointer-events-none z-50 transition-transform duration-0"
          style={{
            transform: `translate(${dragPosition.x - 140}px, ${dragPosition.y - 50}px)`,
            width: '280px'
          }}
        >
          <div className="card-container shadow-2xl transform rotate-2 opacity-95">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-6 leading-relaxed whitespace-pre-wrap break-words">
              {card.description}
            </p>
            <div className="flex items-center justify-end text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isDetailOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Card Detail</h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-300">Content</label>
                <textarea
                  className="input-field w-full h-72 resize-none text-base py-4"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Card content"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  Created on {new Date(card.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  Votes: {card.votes}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="btn-primary flex-1 py-3 transition-all duration-300 transform hover:scale-105"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setEditedContent(card.description);
                  }}
                  className="btn-outline py-3 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setIsDetailOpen(false);
                  }}
                  className="btn-outline text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
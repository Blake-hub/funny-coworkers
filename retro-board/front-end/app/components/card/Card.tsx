'use client';

import { useState, useRef } from 'react';
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
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedContent, setEditedContent] = useState(card.description);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    if (editedTitle.trim()) {
      onUpdate({ title: editedTitle, description: editedContent });
      setIsEditing(false);
      setIsDetailOpen(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this card?')) {
      onDelete();
    }
  };

  return (
    <>
      <div 
        className={`card-container cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'opacity-50' : ''}`}
        onClick={() => setIsDetailOpen(true)}
        draggable="true"
        ref={cardRef}
        onDragStart={(e) => {
          setIsDragging(true);
          // Store card data for drag-and-drop
          e.dataTransfer.setData('text/plain', `${columnId},${card.id}`);
          // Improve drag image
          e.dataTransfer.effectAllowed = 'move';
          
          // Get initial mouse position
          if (e.clientX && e.clientY) {
            setDragPosition({ x: e.clientX, y: e.clientY });
          }
          
          // Create a custom drag image for better visibility
          if (e.currentTarget) {
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.width = '280px';
            dragImage.style.height = 'auto';
            dragImage.style.opacity = '0.9';
            dragImage.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
            dragImage.style.pointerEvents = 'none';
            e.dataTransfer.setDragImage(dragImage, 50, 50);
          }
          
          // Add global dragover listener to track cursor position during drag
          const handleDragOver = (dragEvent: DragEvent) => {
            if (dragEvent.clientX && dragEvent.clientY) {
              setDragPosition({ x: dragEvent.clientX, y: dragEvent.clientY });
            }
          };
          
          document.addEventListener('dragover', handleDragOver);
          
          // Clean up listener on drag end
          const handleDragEnd = () => {
            document.removeEventListener('dragover', handleDragOver);
          };
          
          e.currentTarget.addEventListener('dragend', handleDragEnd, { once: true });
        }}
        onDragEnd={() => {
          // Reset dragging state immediately
          setIsDragging(false);
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-base flex-1 leading-tight truncate">{card.title}</h4>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-600 transition-all duration-200"
              aria-label="Edit card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
              aria-label="Delete card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 dark:text-neutral-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed h-full overflow-hidden">
            {card.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVote();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 transform hover:scale-105"
            aria-label="Vote for card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span className="font-semibold">{card.votes}</span>
          </button>
        </div>
      </div>

      {/* Floating card that follows cursor during drag */}
      {isDragging && (
        <div 
          className="fixed top-0 left-0 pointer-events-none z-50 transition-transform duration-0"
          style={{
            transform: `translate(${dragPosition.x - 140}px, ${dragPosition.y - 50}px)`,
            width: '280px'
          }}
        >
          <div className="card-container shadow-2xl transform rotate-2 opacity-95">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-base flex-1 leading-tight">{card.title}</h4>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
              {card.description}
            </p>
            <div className="flex items-center justify-end text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="card-container">
          <div className="space-y-3">
            <input
              type="text"
              className="input-field w-full text-base py-3"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Card title"
            />
            <textarea
              className="input-field w-full text-sm h-24 resize-none py-3"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Card description"
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
                  setEditedTitle(card.title);
                  setEditedContent(card.description);
                }}
                className="btn-outline text-sm py-3 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailOpen && (
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
                <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-300">Title</label>
                <input
                  type="text"
                  className="input-field w-full text-base py-4"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Card title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-600 dark:text-neutral-300">Content</label>
                <textarea
                  className="input-field w-full h-56 resize-none text-base py-4"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Card description"
                />
              </div>
              <div className="flex items-center justify-end">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  Created on {new Date(card.createdAt).toLocaleDateString()}
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
                  setEditedTitle(card.title);
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
        </div>
      )}
    </>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Card as CardType, ColumnType } from '../types';

interface BoardUpdateEvent {
  type: 'card_created' | 'card_updated' | 'card_deleted' | 'card_voted' | 'column_created' | 'column_updated' | 'column_deleted';
  boardId: number;
  data: any;
  timestamp: number;
}

interface UseBoardWebSocketOptions {
  boardId: number;
  onCardCreated?: (card: CardType) => void;
  onCardUpdated?: (card: CardType) => void;
  onCardDeleted?: (cardId: number) => void;
  onCardVoted?: (card: CardType) => void;
  onColumnCreated?: (column: ColumnType) => void;
  onColumnUpdated?: (column: ColumnType) => void;
  onColumnDeleted?: (columnId: number) => void;
}

export default function useBoardWebSocket({
  boardId,
  onCardCreated,
  onCardUpdated,
  onCardDeleted,
  onCardVoted,
  onColumnCreated,
  onColumnUpdated,
  onColumnDeleted
}: UseBoardWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('useBoardWebSocket: Connecting to board', boardId);
    
    const connect = () => {
      console.log('useBoardWebSocket: Creating SockJS connection to http://localhost:8081/ws');
      const socket = new SockJS('http://localhost:8081/ws');
      
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 3000,
        debug: (str) => console.log('[STOMP]', str),
        onConnect: () => {
          console.log('useBoardWebSocket: WebSocket connected successfully');
          setIsConnected(true);
          
          const destination = `/topic/board/${boardId}`;
          console.log('useBoardWebSocket: Subscribing to', destination);
          
          client.subscribe(destination, (message) => {
            console.log('useBoardWebSocket: Received raw message:', message.body);
            const event: BoardUpdateEvent = JSON.parse(message.body);
            console.log('useBoardWebSocket: Parsed event:', event);
            console.log('useBoardWebSocket: Event type:', event.type);
            console.log('useBoardWebSocket: Event data:', event.data);
            
            switch (event.type) {
              case 'card_created':
                console.log('useBoardWebSocket: Calling onCardCreated');
                onCardCreated?.(event.data);
                break;
              case 'card_updated':
              case 'card_voted':
                console.log('useBoardWebSocket: Calling onCardUpdated');
                onCardUpdated?.(event.data);
                break;
              case 'card_deleted':
                console.log('useBoardWebSocket: Calling onCardDeleted');
                onCardDeleted?.(event.data);
                break;
              case 'column_created':
                console.log('useBoardWebSocket: Calling onColumnCreated');
                onColumnCreated?.(event.data);
                break;
              case 'column_updated':
                console.log('useBoardWebSocket: Calling onColumnUpdated');
                onColumnUpdated?.(event.data);
                break;
              case 'column_deleted':
                console.log('useBoardWebSocket: Calling onColumnDeleted');
                onColumnDeleted?.(event.data);
                break;
              default:
                console.warn('useBoardWebSocket: Unknown event type:', event.type);
            }
          });
        },
        onDisconnect: () => {
          console.log('useBoardWebSocket: WebSocket disconnected');
          setIsConnected(false);
        },
        onStompError: (frame) => {
          console.error('useBoardWebSocket: WebSocket error:', frame);
          setIsConnected(false);
        }
      });
      
      client.activate();
      clientRef.current = client;
    };

    connect();

    return () => {
      console.log('useBoardWebSocket: Cleaning up connection');
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [boardId]); // Simplify dependencies to prevent unnecessary reconnections

  return { isConnected };
}

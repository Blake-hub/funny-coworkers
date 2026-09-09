import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { BoardUpdateEvent } from '@/services/retroApi';

interface UseRetroWebSocketOptions {
  boardId: number | null;
  token: string | null;
  onEvent?: (event: BoardUpdateEvent) => void;
}

interface UseRetroWebSocketResult {
  connected: boolean;
  error: string | null;
}

export function useRetroWebSocket({ boardId, token, onEvent }: UseRetroWebSocketOptions): UseRetroWebSocketResult {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const onEventRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep ref to latest callback without re-subscribing
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const handleMessage = useCallback((message: IMessage) => {
    try {
      const event: BoardUpdateEvent = JSON.parse(message.body);
      onEventRef.current?.(event);
    } catch (e) {
      console.error('Failed to parse retro WS message', e);
    }
  }, []);

  useEffect(() => {
    if (!boardId || !token) return;

    const wsBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:8080';
    const wsUrl = `${wsBaseUrl}/ws`;

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(`${wsUrl}?token=${encodeURIComponent(token)}`),
      connectHeaders: {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      setConnected(true);
      setError(null);
      const dest = `/topic/retro/${boardId}`;
      subscriptionRef.current = client.subscribe(dest, handleMessage);
    };

    client.onStompError = (frame) => {
      console.error('[RetroWS] STOMP error', frame);
      setError('STOMP 协议错误');
    };

    client.onWebSocketError = (evt) => {
      console.error('[RetroWS] WebSocket error', evt);
      setError('WebSocket 连接失败');
      setConnected(false);
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    clientRef.current = client;
    client.activate();

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [boardId, token, handleMessage]);

  return { connected, error };
}

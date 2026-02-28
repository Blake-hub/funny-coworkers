'use client';

import { renderHook, waitFor, act } from '@testing-library/react';
import useBoardWebSocket from './useBoardWebSocket';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Mock dependencies
jest.mock('@stomp/stompjs');
jest.mock('sockjs-client');

let mockClient: any;

beforeEach(() => {
  mockClient = {
    webSocketFactory: jest.fn(),
    reconnectDelay: 3000,
    debug: jest.fn(),
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onStompError: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  };
});

const mockSockJS = jest.fn();

(Client as jest.MockedClass<typeof Client>).mockImplementation(() => mockClient as any);
(SockJS as jest.MockedClass<typeof SockJS>).mockImplementation(() => mockSockJS as any);

describe('useBoardWebSocket', () => {
  const mockOnCardCreated = jest.fn();
  const mockOnCardUpdated = jest.fn();
  const mockOnCardDeleted = jest.fn();
  const mockOnCardVoted = jest.fn();
  const mockOnColumnCreated = jest.fn();
  const mockOnColumnUpdated = jest.fn();
  const mockOnColumnDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to WebSocket when boardId changes', () => {
    const boardId = 1;

    renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    expect(Client).toHaveBeenCalled();
    expect(mockClient.activate).toHaveBeenCalled();
  });

  it('should subscribe to board topic on connect', () => {
    const boardId = 1;
    const expectedDestination = `/topic/board/${boardId}`;

    renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Check that the client was activated
    expect(mockClient.activate).toHaveBeenCalled();
    
    // Simulate connection
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
      
      // Check that subscribe was called with the correct destination
      expect(mockClient.subscribe).toHaveBeenCalledWith(
        expectedDestination,
        expect.any(Function)
      );
    }
  });

  // Helper function to test event handling
  const testEventHandling = (eventType: string, eventData: any, expectedCallback: jest.Mock) => {
    const boardId = 1;

    renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
      
      // Get the subscription callback
      const subscribeCall = mockClient.subscribe.mock.calls[0];
      if (subscribeCall) {
        const subscribeCallback = subscribeCall[1];
        const mockMessage = {
          body: JSON.stringify({
            type: eventType,
            boardId,
            data: eventData,
            timestamp: Date.now(),
          }),
        };

        act(() => {
          subscribeCallback(mockMessage);
        });

        expect(expectedCallback).toHaveBeenCalledWith(eventData);
      }
    }
  };

  it('should call onCardCreated when card_created event is received', () => {
    const mockCard = {
      id: 1,
      title: 'Test Card',
      description: 'Test Description',
      column: { id: 1, name: 'Test Column' },
      position: 0,
      createdAt: new Date().toISOString(),
      votes: 0,
    };

    testEventHandling('card_created', mockCard, mockOnCardCreated);
  });

  it('should call onCardUpdated when card_updated event is received', () => {
    const mockCard = {
      id: 1,
      title: 'Updated Card',
      description: 'Updated Description',
      column: { id: 1, name: 'Test Column' },
      position: 0,
      createdAt: new Date().toISOString(),
      votes: 1,
    };

    testEventHandling('card_updated', mockCard, mockOnCardUpdated);
  });

  it('should call onCardDeleted when card_deleted event is received', () => {
    const mockCardId = 1;
    testEventHandling('card_deleted', mockCardId, mockOnCardDeleted);
  });

  it('should call onCardVoted when card_voted event is received', () => {
    const mockCard = {
      id: 1,
      title: 'Test Card',
      description: 'Test Description',
      column: { id: 1, name: 'Test Column' },
      position: 0,
      createdAt: new Date().toISOString(),
      votes: 1,
    };

    testEventHandling('card_voted', mockCard, mockOnCardUpdated);
  });

  it('should call onColumnCreated when column_created event is received', () => {
    const mockColumn = {
      id: 1,
      name: 'New Column',
      boardId: 1,
      position: 0,
    };

    testEventHandling('column_created', mockColumn, mockOnColumnCreated);
  });

  it('should call onColumnUpdated when column_updated event is received', () => {
    const mockColumn = {
      id: 1,
      name: 'Updated Column',
      boardId: 1,
      position: 1,
    };

    testEventHandling('column_updated', mockColumn, mockOnColumnUpdated);
  });

  it('should call onColumnDeleted when column_deleted event is received', () => {
    const mockColumnId = 1;
    testEventHandling('column_deleted', mockColumnId, mockOnColumnDeleted);
  });

  it('should handle unknown event types gracefully', () => {
    const boardId = 1;
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
      
      // Get the subscription callback
      const subscribeCall = mockClient.subscribe.mock.calls[0];
      if (subscribeCall) {
        const subscribeCallback = subscribeCall[1];
        const mockMessage = {
          body: JSON.stringify({
            type: 'unknown_event',
            boardId,
            data: {},
            timestamp: Date.now(),
          }),
        };

        act(() => {
          subscribeCallback(mockMessage);
        });

        expect(consoleWarnSpy).toHaveBeenCalledWith('useBoardWebSocket: Unknown event type:', 'unknown_event');
      }
    }

    consoleWarnSpy.mockRestore();
  });

  it('should handle JSON parse errors gracefully', () => {
    const boardId = 1;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
      
      // Get the subscription callback
      const subscribeCall = mockClient.subscribe.mock.calls[0];
      if (subscribeCall) {
        const subscribeCallback = subscribeCall[1];
        const mockMessage = {
          body: 'invalid json',
        };

        act(() => {
          subscribeCallback(mockMessage);
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('useBoardWebSocket: Error parsing message:', expect.any(Error));
      }
    }

    consoleErrorSpy.mockRestore();
  });

  it('should clean up connection on unmount', () => {
    const boardId = 1;

    const { unmount } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    unmount();

    expect(mockClient.deactivate).toHaveBeenCalled();
  });

  it('should not update state when cleanupCalled is true in onDisconnect', () => {
    const boardId = 1;

    const { unmount } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection to set up onDisconnect handler
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    // Unmount to set cleanupCalled to true
    unmount();

    // Simulate disconnect event
    const disconnectCallback = mockClient.onDisconnect;
    if (disconnectCallback) {
      act(() => {
        disconnectCallback();
      });
    }

    // No state updates should occur
  });

  it('should not update state when cleanupCalled is true in onStompError', () => {
    const boardId = 1;

    const { unmount } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection to set up onStompError handler
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    // Unmount to set cleanupCalled to true
    unmount();

    // Simulate error event
    const errorCallback = mockClient.onStompError;
    if (errorCallback) {
      act(() => {
        errorCallback({});
      });
    }

    // No state updates should occur
  });

  it('should update state when cleanupCalled is false in onDisconnect', () => {
    const boardId = 1;

    const { result } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection to set up onDisconnect handler and set isConnected to true
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    expect(result.current.isConnected).toBe(true);

    // Simulate disconnect event before unmount (cleanupCalled is false)
    const disconnectCallback = mockClient.onDisconnect;
    if (disconnectCallback) {
      act(() => {
        disconnectCallback();
      });
    }

    expect(result.current.isConnected).toBe(false);
  });

  it('should update state when cleanupCalled is false in onStompError', () => {
    const boardId = 1;

    const { result } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection to set up onStompError handler and set isConnected to true
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    expect(result.current.isConnected).toBe(true);

    // Simulate error event before unmount (cleanupCalled is false)
    const errorCallback = mockClient.onStompError;
    if (errorCallback) {
      act(() => {
        errorCallback({});
      });
    }

    expect(result.current.isConnected).toBe(false);
  });

  it('should not update state when cleanupCalled is true in onConnect', () => {
    const boardId = 1;

    const { unmount } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Unmount to set cleanupCalled to true before onConnect is called
    unmount();

    // Simulate connection event
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    // No state updates should occur
  });

  it('should not process messages when cleanupCalled is true in subscription callback', () => {
    const boardId = 1;

    const { unmount } = renderHook(() =>
      useBoardWebSocket({
        boardId,
        onCardCreated: mockOnCardCreated,
        onCardUpdated: mockOnCardUpdated,
        onCardDeleted: mockOnCardDeleted,
        onCardVoted: mockOnCardVoted,
        onColumnCreated: mockOnColumnCreated,
        onColumnUpdated: mockOnColumnUpdated,
        onColumnDeleted: mockOnColumnDeleted,
      })
    );

    // Simulate connection to set up subscription
    const connectCallback = mockClient.onConnect;
    if (connectCallback) {
      act(() => {
        connectCallback();
      });
    }

    // Get the subscription callback
    const subscribeCall = mockClient.subscribe.mock.calls[0];
    if (subscribeCall) {
      const subscribeCallback = subscribeCall[1];
      const mockMessage = {
        body: JSON.stringify({
          type: 'card_created',
          boardId,
          data: { id: 1, title: 'Test Card' },
          timestamp: Date.now(),
        }),
      };

      // Unmount to set cleanupCalled to true
      unmount();

      // Simulate message receipt after cleanup
      act(() => {
        subscribeCallback(mockMessage);
      });

      // No callbacks should be called
      expect(mockOnCardCreated).not.toHaveBeenCalled();
    }
  });
});

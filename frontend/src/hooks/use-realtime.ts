/**
 * Socket.io real-time client for SyncForge.
 * Manages the WebSocket connection lifecycle and provides
 * a React hook for components to subscribe to live events.
 *
 * The socket authenticates via Clerk JWT at handshake time,
 * matching the backend's `socket.auth.js` middleware.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { taskKeys } from './use-tasks';
import type { Task } from '@/lib/types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

interface SocketOptions {
  getToken: () => Promise<string | null>;
}

/**
 * Initialize or return the singleton socket connection.
 * We lazy-init so it doesn't fire during SSR.
 */
function getSocket(opts: SocketOptions): Socket {
  if (socketInstance?.connected) return socketInstance;

  socketInstance = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: async (cb) => {
      const token = await opts.getToken();
      cb({ token });
    },
  });

  return socketInstance;
}

/**
 * Hook: connect to socket, join team rooms, and auto-invalidate
 * React Query caches when backend broadcasts events.
 */
export function useRealtimeSync(teamIds: string[], getToken: () => Promise<string | null>) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());

  // Stable callbacks
  const handleTaskCreated = useCallback(
    (task: Task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    [queryClient],
  );

  const handleTaskUpdated = useCallback(
    (task: Task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    [queryClient],
  );

  const handleTaskDeleted = useCallback(
    ({ id }: { id: string }) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    [queryClient],
  );

  useEffect(() => {
    // Don't run during SSR
    if (typeof window === 'undefined') return;

    const socket = getSocket({ getToken });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.debug('[SyncForge WS] Connected:', socket.id);
      // Re-join rooms on reconnect
      teamIds.forEach((teamId) => {
        socket.emit('team:join', teamId);
        joinedRooms.current.add(teamId);
      });
    });

    socket.on('disconnect', (reason) => {
      console.debug('[SyncForge WS] Disconnected:', reason);
      joinedRooms.current.clear();
    });

    // Real-time data events
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    // Connect if not already
    if (!socket.connected) {
      socket.connect();
    }

    // Join any new rooms
    teamIds.forEach((teamId) => {
      if (!joinedRooms.current.has(teamId)) {
        socket.emit('team:join', teamId);
        joinedRooms.current.add(teamId);
      }
    });

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);

      // Leave rooms but keep socket open (singleton)
      joinedRooms.current.forEach((teamId) => {
        socket.emit('team:leave', teamId);
      });
      joinedRooms.current.clear();
    };
  }, [teamIds.join(','), getToken, handleTaskCreated, handleTaskUpdated, handleTaskDeleted]);

  return socketRef;
}

/**
 * Hook: emit typing indicators to a team room.
 */
export function useTypingIndicator(socket: Socket | null, teamId: string) {
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const startTyping = useCallback(
    (taskId: string) => {
      if (!socket?.connected) return;
      socket.emit('typing:start', { teamId, taskId });

      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing:stop', { teamId, taskId });
      }, 3000);
    },
    [socket, teamId],
  );

  const stopTyping = useCallback(
    (taskId: string) => {
      if (!socket?.connected) return;
      clearTimeout(typingTimeout.current);
      socket.emit('typing:stop', { teamId, taskId });
    },
    [socket, teamId],
  );

  return { startTyping, stopTyping };
}

import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

/**
 * useSocket
 * Subscribe to a socket event and auto-cleanup on unmount.
 * Usage: useSocket('file:updated', (data) => handleUpdate(data))
 */
export function useSocket(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}

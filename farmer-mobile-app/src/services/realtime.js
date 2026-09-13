import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL
  || 'https://hackindia-ai-web3-builders-hackathon-i3ff.onrender.com';

export function createMobileRealtimeConnection({ onStatusChange, onTelemetryTick } = {}) {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 10000
  });

  socket.on('connect', () => onStatusChange?.('connected'));
  socket.on('disconnect', () => onStatusChange?.('disconnected'));
  socket.on('connect_error', () => onStatusChange?.('error'));
  if (onTelemetryTick) socket.on('telemetry_tick', onTelemetryTick);

  return () => socket.disconnect();
}

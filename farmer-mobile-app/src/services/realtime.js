import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL
  || 'https://hackindia-ai-web3-builders-hackathon-i3ff.onrender.com';

export function createMobileRealtimeConnection({
  farmerId,
  onStatusChange,
  onTelemetryTick,
  onCollectionRequestCreated,
  onCollectionRequestUpdated,
  onNdlmRegistrationUpdated
} = {}) {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 10000
  });

  socket.on('connect', () => {
    if (farmerId) socket.emit('join_farmer', farmerId);
    onStatusChange?.('connected');
  });
  socket.on('disconnect', () => onStatusChange?.('disconnected'));
  socket.on('connect_error', () => onStatusChange?.('error'));
  if (onTelemetryTick) socket.on('telemetry_tick', onTelemetryTick);
  if (onCollectionRequestCreated) socket.on('collection_request_created', onCollectionRequestCreated);
  if (onCollectionRequestUpdated) socket.on('collection_request_updated', onCollectionRequestUpdated);
  if (onNdlmRegistrationUpdated) socket.on('ndlm_registration_updated', onNdlmRegistrationUpdated);

  return () => socket.disconnect();
}

import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/v1$/, '');

export function createRealtimeConnection({ onMilkLogged, onGrievanceCreated, onNdlmRegistrationCreated, onTelemetryTick }) {
  const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

  socket.on('milk_logged', onMilkLogged);
  socket.on('grievance_created', onGrievanceCreated);
  socket.on('ndlm_registration_created', onNdlmRegistrationCreated);
  socket.on('telemetry_tick', onTelemetryTick);

  return () => socket.disconnect();
}

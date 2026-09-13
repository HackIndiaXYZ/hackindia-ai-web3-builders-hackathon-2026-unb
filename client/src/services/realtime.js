import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/v1$/, '');

export function createRealtimeConnection({
  onConnect,
  onDisconnect,
  onMilkLogged,
  onGrievanceCreated,
  onNdlmRegistrationCreated,
  onNdlmRegistrationUpdated,
  onCollectionRequestCreated,
  onCollectionRequestUpdated,
  onRiskAnomalyProvisional,
  onRiskAnomalyReviewed,
  onRaidRecommendationUpdated,
  onTelemetryTick
}) {
  const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    if (onConnect) onConnect(socket);
  });

  socket.on('disconnect', () => {
    if (onDisconnect) onDisconnect();
  });
  socket.on('connect_error', () => {
    if (onDisconnect) onDisconnect();
  });

  socket.on('milk_logged', onMilkLogged);
  socket.on('grievance_created', onGrievanceCreated);
  socket.on('ndlm_registration_created', onNdlmRegistrationCreated);
  socket.on('ndlm_registration_updated', onNdlmRegistrationUpdated);
  socket.on('ndlm_registration_reviewed', onNdlmRegistrationUpdated);
  socket.on('collection_request_created', onCollectionRequestCreated);
  socket.on('collection_request_updated', onCollectionRequestUpdated);
  socket.on('risk_anomaly_provisional', onRiskAnomalyProvisional);
  socket.on('risk_anomaly_reviewed', onRiskAnomalyReviewed);
  socket.on('raid_recommendation_created', onRaidRecommendationUpdated);
  socket.on('raid_recommendation_updated', onRaidRecommendationUpdated);
  socket.on('telemetry_tick', onTelemetryTick);

  return () => socket.disconnect();
}

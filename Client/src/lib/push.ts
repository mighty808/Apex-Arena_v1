import { apiGet, apiPost, apiDelete } from '../utils/api.utils';
import { PUSH_ENDPOINTS } from '../config/api.config';

const SERVICE_WORKER_PATH = '/service-worker.js';

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// The VAPID key arrives base64url-encoded; PushManager.subscribe wants a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  await navigator.serviceWorker.ready;
  return registration;
}

/** Whether this browser currently has an active push subscription. */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

/**
 * Full opt-in flow: permission prompt → service worker registration →
 * PushManager subscription → save subscription on the backend.
 * Must be called from a user gesture (e.g. toggle click) — browsers
 * penalize unsolicited permission prompts.
 */
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const keyResponse = await apiGet(PUSH_ENDPOINTS.VAPID_PUBLIC_KEY, { skipAuth: true });
  if (!keyResponse.success) {
    throw new Error('Could not fetch push configuration from the server.');
  }
  const publicKey = (keyResponse.data as { public_key?: string }).public_key;
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server yet.');
  }

  const registration = await getServiceWorkerRegistration();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const response = await apiPost(PUSH_ENDPOINTS.SUBSCRIBE, subscription.toJSON());
  if (!response.success) {
    // Roll back the browser-side subscription so state doesn't diverge
    await subscription.unsubscribe().catch(() => {});
    throw new Error(response.error?.message ?? 'Failed to save push subscription.');
  }
}

/** Removes the subscription both browser-side and on the backend. */
export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => {});
  await apiDelete(PUSH_ENDPOINTS.SUBSCRIBE, { endpoint }).catch(() => {});
}

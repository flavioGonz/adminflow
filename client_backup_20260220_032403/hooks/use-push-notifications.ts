"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';


// Generate VAPID keys: npx web-push generate-vapid-keys
// For now, you need to set these in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as PushPermissionState);
    } else {
      setPermission('unsupported');
    }

    setIsLoading(false);
  }, []);

  // Get existing subscription
  useEffect(() => {
    if (!isSupported) return;

    const getSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        setSubscription(existingSub);
      } catch (error) {
        console.error('Error getting push subscription:', error);
      }
    };

    getSubscription();
  }, [isSupported]);

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.error('Push notifications not supported');
      return false;
    }

    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get VAPID key from server if not hardcoded
      let vapidPublicKey = VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        try {
          const keyRes = await fetch('/api/push/key');
          const keyData = await keyRes.json();
          vapidPublicKey = keyData.publicKey;
        } catch (e) {
          console.error("Failed to fetch VAPID key from server", e);
        }
      }

      if (!vapidPublicKey) {
        toast.error("Servidor no configurado para Notificaciones Push (Faltan llaves VAPID)");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      setSubscription(sub);

      // Send subscription to backend
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON())
        });
      } catch (error) {
        console.error('Error saving subscription to backend:', error);
      }

      return true;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      if (error.name === 'AbortError') {
        toast.error("Error de suscripción: El navegador requiere una clave válida o falló el registro.");
      }
      return false;
    }
  }, [isSupported]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return true;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify backend
      try {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      } catch (error) {
        console.error('Error notifying backend of unsubscribe:', error);
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [subscription]);

  // Send a local notification (doesn't require push subscription)
  const sendLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported) return;

    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);
      if (result !== 'granted') return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/assets/patchpanel/rj45.png',
      badge: '/assets/patchpanel/rj45.png',
      ...options
    });
  }, [isSupported]);

  return {
    isSupported,
    isLoading,
    permission,
    subscription,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
    sendLocalNotification
  };
}

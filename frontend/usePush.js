import { useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function usePush(slug) {
  useEffect(() => {
    if (!slug || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function registrar() {
      try {
        // Registra o service worker
        const reg = await navigator.serviceWorker.register('/sw.js');

        // Busca a chave pública VAPID
        const { data } = await axios.get(`${API}/api/push/vapid-public-key`);
        const publicKey = data.publicKey;

        // Pede permissão
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Cria a subscription
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Salva no backend
        await axios.post(`${API}/api/push/subscribe/${slug}`, { subscription });
        console.log('✅ Push registrado!');
      } catch (err) {
        console.error('Erro ao registrar push:', err.message);
      }
    }

    registrar();
  }, [slug]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

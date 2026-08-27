import { useState, useEffect } from 'react';
import { IGSessionConfig } from '../types/instagram';

export function useInstagramSession() {
  const [session, setSession] = useState<IGSessionConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Cargar sesión inicial desde storage o background
    chrome.storage.local.get(['igSession'], (res) => {
      if (res.igSession) {
        setSession(res.igSession);
      }
      setLoading(false);
    });

    // Escuchar actualizaciones de storage cuando el background capture nuevos headers
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.igSession && changes.igSession.newValue) {
        setSession(changes.igSession.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return {
    session,
    isConnected: Boolean(session && session.headers && (session.headers['x-csrftoken'] || session.headers['x-ig-app-id'])),
    userId: session?.userId || null,
    loading
  };
}

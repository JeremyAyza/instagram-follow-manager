import { useState, useEffect, useMemo, useRef } from 'react';
import { InstagramUser, ScanStatus } from '../types/instagram';

export type FilterTab = 'all' | 'common' | 'creators';

const deduplicateUsers = (users: InstagramUser[]): InstagramUser[] => {
  if (!Array.isArray(users)) return [];
  const seen = new Set<string>();
  return users.filter(u => {
    if (!u || !u.id) return false;
    const key = String(u.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function useInstagramScan() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  
  const [following, setFollowing] = useState<InstagramUser[]>([]);
  const [followers, setFollowers] = useState<InstagramUser[]>([]);
  const [lastScannedAt, setLastScannedAt] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos previos si existen
  useEffect(() => {
    chrome.storage.local.get(['ig_following', 'ig_followers', 'ig_lastScannedAt', 'scanProgress'], (res) => {
      if (res.ig_following) setFollowing(deduplicateUsers(res.ig_following));
      if (res.ig_followers) setFollowers(deduplicateUsers(res.ig_followers));
      if (res.ig_lastScannedAt) setLastScannedAt(res.ig_lastScannedAt);
      
      if (res.scanProgress) {
        const { status: currentStatus, followingCount: ingCount, followersCount: ersCount, error } = res.scanProgress;
        setStatus(currentStatus);
        setFollowingCount(ingCount || 0);
        setFollowersCount(ersCount || 0);
        setErrorMessage(error);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.scanProgress && changes.scanProgress.newValue) {
        const val = changes.scanProgress.newValue;
        setStatus(val.status);
        setFollowingCount(val.followingCount || 0);
        setFollowersCount(val.followersCount || 0);
        setErrorMessage(val.error);
      }

      if (changes.ig_following && changes.ig_following.newValue) {
        setFollowing(deduplicateUsers(changes.ig_following.newValue));
      }
      if (changes.ig_followers && changes.ig_followers.newValue) {
        setFollowers(deduplicateUsers(changes.ig_followers.newValue));
      }
      if (changes.ig_lastScannedAt && changes.ig_lastScannedAt.newValue) {
        setLastScannedAt(changes.ig_lastScannedAt.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Lista base: NO SEGUIDORES (Personas que sigo pero no me siguen de vuelta)
  // Requerimos que AMBAS listas existan para hacer la comparación.
  const nonFollowers = useMemo(() => {
    if (following.length === 0 || followers.length === 0) return [];
    
    const uniqueFollowing = deduplicateUsers(following);
    const uniqueFollowers = deduplicateUsers(followers);
    const followersIds = new Set(uniqueFollowers.map(u => u.id));
    
    return uniqueFollowing.filter(u => !followersIds.has(u.id));
  }, [following, followers]);

  // Aplicar filtros de las pestañas sobre los NO SEGUIDORES
  const filteredUsers = useMemo(() => {
    if (activeTab === 'all') {
      return nonFollowers;
    }
    
    if (activeTab === 'common') {
      // "Comunes" = Usuarios normales (no verificados, no creadores)
      return nonFollowers.filter(u => !u.is_creator && !u.is_verified);
    }
    
    if (activeTab === 'creators') {
      // "Creadores/Verificados"
      return nonFollowers.filter(u => u.is_creator || u.is_verified);
    }
    
    return nonFollowers;
  }, [nonFollowers, activeTab]);

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const shouldStopRef = useRef(false);

  const fetchUsers = async (type: 'following' | 'followers') => {
    setErrorMessage(null);
    shouldStopRef.current = false;
    
    const { igSession } = await chrome.storage.local.get('igSession');
    if (!igSession || !igSession.headers) {
      setErrorMessage('No se encontró la sesión de Instagram. Recarga la página con tu cuenta iniciada.');
      return;
    }

    const statusType = type === 'following' ? 'fetching_following' : 'fetching_followers';
    const progressState = { status: statusType as ScanStatus, followingCount: 0, followersCount: 0, error: null as string | null };
    
    const updateProgress = async (updates: Partial<typeof progressState>) => {
      Object.assign(progressState, updates);
      await chrome.storage.local.set({ scanProgress: progressState });
    };

    try {
      await updateProgress({ status: statusType, error: null });

      // Importar dinámicamente o asegurarse de que está importado arriba
      const { fetchUsersList } = await import('../utils/instagram-api');
      
      const users = await fetchUsersList(
        igSession,
        type,
        async (count) => {
          if (type === 'following') await updateProgress({ followingCount: count });
          else await updateProgress({ followersCount: count });
        },
        () => shouldStopRef.current
      );

      if (shouldStopRef.current) {
        await updateProgress({ status: 'idle' });
        return;
      }

      const storageKey = type === 'following' ? 'ig_following' : 'ig_followers';
      await chrome.storage.local.set({ 
        [storageKey]: users,
        ig_lastScannedAt: Date.now()
      });
      await updateProgress({ status: 'complete' });
      
    } catch (err: any) {
      const errMsg = err?.message || `Error obteniendo ${type}.`;
      await updateProgress({ status: 'error', error: errMsg });
    }
  };

  const fetchAll = async () => {
    setErrorMessage(null);
    shouldStopRef.current = false;
    
    const { igSession } = await chrome.storage.local.get('igSession');
    if (!igSession || !igSession.headers) {
      setErrorMessage('No se encontró la sesión de Instagram. Recarga la página con tu cuenta iniciada.');
      return;
    }

    const progressState = { status: 'fetching_following' as ScanStatus, followingCount: 0, followersCount: 0, error: null as string | null };
    const updateProgress = async (updates: Partial<typeof progressState>) => {
      Object.assign(progressState, updates);
      await chrome.storage.local.set({ scanProgress: progressState });
    };

    try {
      await updateProgress({ status: 'fetching_following', followingCount: 0, followersCount: 0, error: null });
      const { fetchUsersList } = await import('../utils/instagram-api');

      const following = await fetchUsersList(
        igSession, 'following',
        async (count) => await updateProgress({ followingCount: count }),
        () => shouldStopRef.current
      );

      if (shouldStopRef.current) {
        await updateProgress({ status: 'idle' });
        return;
      }

      await updateProgress({ status: 'fetching_followers' });

      const followers = await fetchUsersList(
        igSession, 'followers',
        async (count) => await updateProgress({ followersCount: count }),
        () => shouldStopRef.current
      );

      if (shouldStopRef.current) {
        await updateProgress({ status: 'idle' });
        return;
      }

      await chrome.storage.local.set({
        ig_following: following,
        ig_followers: followers,
        ig_lastScannedAt: Date.now()
      });
      await updateProgress({ status: 'complete' });

    } catch (err: any) {
      const errMsg = err?.message || 'Error obteniendo datos.';
      await updateProgress({ status: 'error', error: errMsg });
    }
  };

  const stopScan = () => {
    shouldStopRef.current = true;
    chrome.storage.local.set({
      scanProgress: { status: 'idle', followingCount: 0, followersCount: 0, error: null }
    });
    setStatus('idle');
  };

  const toggleSelectUser = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Recibe los IDs visibles (ya filtrados por la búsqueda) para no
  // seleccionar cuentas que el usuario no está viendo.
  const toggleSelectAll = (visibleIds: string[]) => {
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleIds));
  };

  const importData = useCallback((data: { following?: InstagramUser[], followers?: InstagramUser[] }) => {
    chrome.storage.local.get(['ig_following', 'ig_followers'], (res) => {
      const updates: any = {};
      
      if (data.following) {
        const mergedFollowing = deduplicateUsers([...(res.ig_following || []), ...data.following]);
        updates.ig_following = mergedFollowing;
      }
      if (data.followers) {
        const mergedFollowers = deduplicateUsers([...(res.ig_followers || []), ...data.followers]);
        updates.ig_followers = mergedFollowers;
      }
      
      updates.ig_lastScannedAt = Date.now();
      chrome.storage.local.set(updates);
    });
  }, []);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter(u => selectedIds.has(u.id));
  }, [filteredUsers, selectedIds]);

  return {
    status,
    followingCount,
    followersCount,
    following,
    followers,
    lastScannedAt,
    filteredUsers,
    selectedUsers,
    selectedIds,
    activeTab,
    setActiveTab,
    errorMessage,
    fetchUsers,
    fetchAll,
    stopScan,
    toggleSelectUser,
    toggleSelectAll,
    importData
  };
}

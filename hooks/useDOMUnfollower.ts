import { useState, useRef, useCallback, useEffect } from 'react';
import { InstagramUser, UnfollowProgressState } from '../types/instagram';
import { executeProfileUnfollowDOM } from '../utils/dom-automation';
import { APP_CONFIG } from '../utils/constants';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface UnfollowSummaryData {
  success: InstagramUser[];
  errors: { user: InstagramUser; reason: string }[];
  notSelected: InstagramUser[];
}

interface StoredSession {
  usersToUnfollow: InstagramUser[];
  allUsersInList: InstagramUser[];
  progress: UnfollowProgressState;
}

export function useDOMUnfollower() {
  const [progress, setProgress] = useState<UnfollowProgressState>({
    isProcessing: false,
    isPaused: false,
    currentIndex: 0,
    total: 0,
    currentUsername: '',
    successCount: 0,
    failedCount: 0,
    logs: []
  });

  const [unfollowSummary, setUnfollowSummary] = useState<UnfollowSummaryData | null>(null);

  const shouldStopRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);

  // Guardar estado en storage
  const saveSessionState = async (currentState: StoredSession) => {
    await chrome.storage.local.set({ unfollowSession: currentState });
  };

  const removeUserFromScanData = async (userId: string) => {
    const res = await chrome.storage.local.get(['ig_following']);
    if (res.ig_following && Array.isArray(res.ig_following)) {
      const updatedFollowing = res.ig_following.filter((u: InstagramUser) => String(u.id) !== String(userId));
      await chrome.storage.local.set({ ig_following: updatedFollowing });
    }
  };

  const runQueue = async (session: StoredSession) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const { usersToUnfollow, allUsersInList } = session;
    let currentProgress = { ...session.progress, isProcessing: true };
    
    // Si viene pausada o detenida forzamos el reset de variables
    shouldStopRef.current = false;
    isPausedRef.current = currentProgress.isPaused;
    
    setProgress(currentProgress);

    let actionsInBatch = 0;
    let nextBatchLimit = APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MIN_SIZE + Math.floor(Math.random() * (APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MAX_SIZE - APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MIN_SIZE));

    const successUsers: InstagramUser[] = [];
    const errorUsers: { user: InstagramUser; reason: string }[] = [];
    const unfollowedIds = new Set(usersToUnfollow.map(u => u.id));
    const notSelected = allUsersInList.filter(u => !unfollowedIds.has(u.id));

    try {
      for (let i = currentProgress.currentIndex; i < usersToUnfollow.length; i++) {
        if (shouldStopRef.current) break;

        while (isPausedRef.current && !shouldStopRef.current) {
          await delay(500);
        }
        if (shouldStopRef.current) break;

        const targetUser = usersToUnfollow[i];

        currentProgress = {
          ...currentProgress,
          currentIndex: i + 1,
          currentUsername: targetUser.username
        };
        setProgress(currentProgress);
        await saveSessionState({ usersToUnfollow, allUsersInList, progress: currentProgress });

        const targetUrl = `https://www.instagram.com/${targetUser.username}/`;
        if (!window.location.href.includes(`/${targetUser.username}/`)) {
          window.history.pushState({}, '', targetUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));
          await delay(2000 + Math.random() * 500);
        }

        const res = await executeProfileUnfollowDOM();

        const logItem = {
          timestamp: new Date().toLocaleTimeString(),
          username: targetUser.username,
          user: targetUser,
          status: (res.success ? 'success' : 'failed') as 'success' | 'failed',
          message: res.message
        };
        
        if (res.success) {
          successUsers.push(targetUser);
          await removeUserFromScanData(targetUser.id);
        } else {
          errorUsers.push({ user: targetUser, reason: res.message });
        }

        currentProgress = {
          ...currentProgress,
          successCount: res.success ? currentProgress.successCount + 1 : currentProgress.successCount,
          failedCount: res.success ? currentProgress.failedCount : currentProgress.failedCount + 1,
          logs: [logItem, ...currentProgress.logs]
        };
        setProgress(currentProgress);
        await saveSessionState({ usersToUnfollow, allUsersInList, progress: currentProgress });

        if (i < usersToUnfollow.length - 1 && !shouldStopRef.current) {
          actionsInBatch++;
          
          if (actionsInBatch >= nextBatchLimit) {
            const longWait = APP_CONFIG.DELAYS.UNFOLLOW_LONG_MIN_MS + Math.random() * (APP_CONFIG.DELAYS.UNFOLLOW_LONG_MAX_MS - APP_CONFIG.DELAYS.UNFOLLOW_LONG_MIN_MS);
            const pauseLog = {
              timestamp: new Date().toLocaleTimeString(),
              username: 'SISTEMA',
              status: 'skipped' as const,
              message: `Pausa de seguridad humana por ~1 min (${Math.round(longWait / 1000)}s)...`
            };
            currentProgress = { ...currentProgress, logs: [pauseLog, ...currentProgress.logs] };
            setProgress(currentProgress);
            await saveSessionState({ usersToUnfollow, allUsersInList, progress: currentProgress });
            
            await delay(longWait);
            actionsInBatch = 0;
            nextBatchLimit = APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MIN_SIZE + Math.floor(Math.random() * (APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MAX_SIZE - APP_CONFIG.DELAYS.UNFOLLOW_BATCH_MIN_SIZE));
          } else {
            const standardWait = APP_CONFIG.DELAYS.UNFOLLOW_STANDARD_MIN_MS + Math.random() * (APP_CONFIG.DELAYS.UNFOLLOW_STANDARD_MAX_MS - APP_CONFIG.DELAYS.UNFOLLOW_STANDARD_MIN_MS);
            await delay(standardWait);
          }
        }
      }

      if (!shouldStopRef.current) {
        // Finalizó normalmente
        currentProgress = { ...currentProgress, isProcessing: false, isPaused: false };
        setProgress(currentProgress);
        
        setUnfollowSummary({
          success: successUsers,
          errors: errorUsers,
          notSelected: notSelected
        });
        
        // Limpiar sesión
        await chrome.storage.local.remove('unfollowSession');
      }
    } finally {
      processingRef.current = false;
    }
  };

  // Efecto de inicialización para recuperar sesión en caso de recarga
  useEffect(() => {
    // La configuración se lee de storage junto con la sesión: el estado de
    // useSettings todavía no está cargado al montar.
    chrome.storage.local.get(['unfollowSession', 'appSettings'], (res) => {
      if (res.unfollowSession) {
        const session = res.unfollowSession as StoredSession;
        const autoResume = res.appSettings?.autoResumeOnRefresh ?? true;
        // Solo reanudamos si no había terminado y no estábamos ya procesando en esta instancia
        if (session.progress.currentIndex < session.progress.total && !processingRef.current) {
          // Solo reanudamos automáticamente si la configuración lo permite Y el usuario NO lo había pausado manualmente.
          if (autoResume && !session.progress.isPaused) {
             console.log('[IG-EXT] Reanudando sesión de unfollow automáticamente tras corte abrupto...');
             session.progress.isPaused = false;
             runQueue(session);
          } else {
             console.log('[IG-EXT] Sesión encontrada (pausada manualmente o auto-resume off). Esperando intervención manual...');
             session.progress.isPaused = true;
             setProgress(session.progress);
             isPausedRef.current = true;
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  const startUnfollowQueue = useCallback(async (usersToUnfollow: InstagramUser[], allUsersInList: InstagramUser[]) => {
    if (usersToUnfollow.length === 0) return;

    setUnfollowSummary(null);

    const initialProgress: UnfollowProgressState = {
      isProcessing: true,
      isPaused: false,
      currentIndex: 0,
      total: usersToUnfollow.length,
      currentUsername: usersToUnfollow[0].username,
      successCount: 0,
      failedCount: 0,
      logs: []
    };

    const session = { usersToUnfollow, allUsersInList, progress: initialProgress };
    await saveSessionState(session);
    
    runQueue(session);
  }, []);

  const pauseUnfollow = useCallback(() => {
    isPausedRef.current = true;
    setProgress(prev => {
      const next = { ...prev, isPaused: true };
      chrome.storage.local.get(['unfollowSession'], (res) => {
        if (res.unfollowSession) {
          saveSessionState({ ...res.unfollowSession, progress: next });
        }
      });
      return next;
    });
  }, []);

  const resumeUnfollow = useCallback(() => {
    isPausedRef.current = false;
    setProgress(prev => {
      const next = { ...prev, isPaused: false };
      chrome.storage.local.get(['unfollowSession'], (res) => {
        if (res.unfollowSession) {
          saveSessionState({ ...res.unfollowSession, progress: next });
          if (!processingRef.current) {
            runQueue({ ...res.unfollowSession, progress: next });
          }
        }
      });
      return next;
    });
  }, []);

  const stopUnfollow = useCallback(() => {
    shouldStopRef.current = true;
    isPausedRef.current = false;
    setProgress(prev => ({ ...prev, isProcessing: false, isPaused: false }));
    chrome.storage.local.remove('unfollowSession');
  }, []);
  
  const clearSummary = useCallback(() => {
    setUnfollowSummary(null);
  }, []);

  return {
    progress,
    unfollowSummary,
    startUnfollowQueue,
    pauseUnfollow,
    resumeUnfollow,
    stopUnfollow,
    clearSummary
  };
}

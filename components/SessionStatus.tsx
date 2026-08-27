import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SessionStatusProps {
  isConnected: boolean;
  userId: string | null;
  loading: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({ isConnected, userId, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs text-neutral-400">
        <RefreshCw size={14} className="animate-spin text-purple-400" />
        Comprobando conexión con Instagram...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center justify-between p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <span className="font-semibold text-emerald-300">Conectado a Instagram</span>
            <span className="block text-[11px] text-neutral-400">ID Usuario: {userId || 'Autodetectado'}</span>
          </div>
        </div>
        <Wifi size={16} className="text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 text-xs">
      <div className="flex items-center gap-2.5">
        <WifiOff size={16} className="text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-amber-300">Esperando headers de Instagram</span>
          <span className="block text-[11px] text-neutral-400">Navega o recarga en Instagram para conectar automáticamente.</span>
        </div>
      </div>
    </div>
  );
};

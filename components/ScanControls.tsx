import React, { useRef } from 'react';
import { Loader2, Square, Users, Download, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ScanStatus, InstagramUser } from '../types/instagram';

interface ScanControlsProps {
  status: ScanStatus;
  isConnected: boolean;
  followingCount: number;
  followersCount: number;
  following: InstagramUser[];
  followers: InstagramUser[];
  lastScannedAt: number | null;
  onFetchUsers: (type: 'following' | 'followers') => void;
  onFetchAll: () => void;
  onStopScan: () => void;
  onImportData: (data: { following?: InstagramUser[], followers?: InstagramUser[] }) => void;
}

export const ScanControls: React.FC<ScanControlsProps> = ({
  status,
  isConnected,
  followingCount,
  followersCount,
  following,
  followers,
  lastScannedAt,
  onFetchUsers,
  onFetchAll,
  onStopScan,
  onImportData
}) => {
  const followingInputRef = useRef<HTMLInputElement>(null);
  const followersInputRef = useRef<HTMLInputElement>(null);
  const isScanning = status !== 'idle' && status !== 'complete' && status !== 'error';

  const handleExport = (type: 'following' | 'followers') => {
    const dataArray = type === 'following' ? following : followers;
    const blob = new Blob([JSON.stringify(dataArray, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ig-${type}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (type: 'following' | 'followers') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportData({ [type]: json });
        } else {
          alert('Formato inválido. Se esperaba un arreglo JSON directo.');
        }
      } catch (err) {
        alert('Error al importar JSON');
      }
      if (type === 'following' && followingInputRef.current) followingInputRef.current.value = '';
      if (type === 'followers' && followersInputRef.current) followersInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const formatLastScanned = (timestamp: number | null) => {
    if (!timestamp) return null;
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Datos actualizados hace un momento';
    if (mins < 60) return `Datos actualizados hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Datos actualizados hace ${hours} horas`;
    const dateStr = new Date(timestamp).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `Datos del ${dateStr}`;
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/90 rounded-2xl border border-teal-500/20 shadow-xl shadow-teal-900/20 text-slate-200">
      
      {!isScanning ? (
        <div className="flex flex-col gap-2">
          {/* Fila 1: Seguidos */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFetchUsers('following')}
              disabled={!isConnected}
              className="flex-1 py-2 px-3 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-teal-500/30 text-teal-300 hover:text-teal-200"
            >
              <Users size={14} />
              <span>Obtener Seguidos</span>
            </button>
            <div className="w-32 py-2 px-2 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400">
              {following.length > 0 ? (
                <><CheckCircle2 size={12} className="text-teal-500" /> {following.length} listos</>
              ) : (
                <span className="text-slate-500">Sin datos</span>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => handleExport('following')} 
                disabled={following.length === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-teal-300 disabled:opacity-30 transition-colors" 
                title="Exportar Seguidos"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={() => followingInputRef.current?.click()} 
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-teal-300 transition-colors" 
                title="Importar Seguidos"
              >
                <Upload size={14} />
              </button>
              <input type="file" accept=".json" className="hidden" ref={followingInputRef} onChange={handleImport('following')} />
            </div>
          </div>

          {/* Fila 2: Seguidores */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFetchUsers('followers')}
              disabled={!isConnected}
              className="flex-1 py-2 px-3 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 border border-blue-500/30 text-blue-400 hover:text-blue-300"
            >
              <Users size={14} />
              <span>Obtener Seguidores</span>
            </button>
            <div className="w-32 py-2 px-2 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400">
              {followers.length > 0 ? (
                <><CheckCircle2 size={12} className="text-blue-500" /> {followers.length} listos</>
              ) : (
                <span className="text-slate-500">Sin datos</span>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => handleExport('followers')} 
                disabled={followers.length === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-blue-300 disabled:opacity-30 transition-colors" 
                title="Exportar Seguidores"
              >
                <Download size={14} />
              </button>
              <button 
                onClick={() => followersInputRef.current?.click()} 
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-blue-300 transition-colors" 
                title="Importar Seguidores"
              >
                <Upload size={14} />
              </button>
              <input type="file" accept=".json" className="hidden" ref={followersInputRef} onChange={handleImport('followers')} />
            </div>
          </div>

          {/* Fila 3: Sincronizar Ambos + Export/Import */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onFetchAll}
              disabled={!isConnected}
              className="flex-1 py-2.5 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300"
            >
              <RefreshCw size={14} />
              <span>Sincronizar Ambos</span>
            </button>
            
          </div>

          {/* Micro-indicador de antigüedad de datos */}
          {lastScannedAt && (following.length > 0 || followers.length > 0) && (
            <div className="text-[9px] text-slate-500 text-right px-1 mt-0.5 italic">
              {formatLastScanned(lastScannedAt)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Indicador de Progreso Dinámico */}
          <div className="p-3 bg-teal-950/40 rounded-lg border border-teal-800/40 flex items-center gap-3 text-xs text-teal-200">
            <Loader2 size={16} className="animate-spin text-teal-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold capitalize text-[11px] truncate">
                {status === 'fetching_following' && 'Extrayendo Seguidos de IG...'}
                {status === 'fetching_followers' && 'Extrayendo Seguidores de IG...'}
                {status === 'comparing' && 'Procesando datos...'}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                {status === 'fetching_following' && (
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300">{followingCount} obtenidos</span>
                )}
                {status === 'fetching_followers' && (
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300">{followersCount} obtenidos</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onStopScan}
            className="w-full py-2.5 px-4 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer bg-red-600/80 hover:bg-red-500 text-white border border-red-500/50"
          >
            <Square size={14} fill="currentColor" />
            <span>Detener Proceso</span>
          </button>
        </div>
      )}
    </div>
  );
};

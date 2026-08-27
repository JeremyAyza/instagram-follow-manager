import React from 'react';
import { Pause, Play, Square, CheckCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { UnfollowProgressState } from '../types/instagram';

interface UnfollowProgressProps {
  progress: UnfollowProgressState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const UnfollowProgress: React.FC<UnfollowProgressProps> = ({
  progress,
  onPause,
  onResume,
  onStop
}) => {
  const percentage = progress.total > 0 ? Math.round((progress.currentIndex / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 shadow-2xl flex-1 min-h-0">
      {/* Encabezado y Progreso */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-neutral-200 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-pink-500" />
            Dejando de seguir por navegación DOM...
          </span>
          <span className="font-bold text-pink-400">{percentage}%</span>
        </div>

        {/* Barra de Progreso */}
        <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-2">
          <span>Procesando: <strong className="text-neutral-200">@{progress.currentUsername}</strong></span>
          <span>{progress.currentIndex} de {progress.total}</span>
        </div>
      </div>

      {/* Botones de Control */}
      <div className="grid grid-cols-2 gap-2">
        {progress.isPaused ? (
          <button
            onClick={onResume}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Play size={14} fill="currentColor" />
            <span>Reanudar</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Pause size={14} fill="currentColor" />
            <span>Pausar</span>
          </button>
        )}

        <button
          onClick={onStop}
          className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <Square size={14} fill="currentColor" />
          <span>Detener</span>
        </button>
      </div>

      {/* Historial de Logs */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 mt-2">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0">
          Registro en tiempo real
        </span>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs min-h-0">
          {progress.logs.map((log, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                log.status === 'success'
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100 shadow-sm shadow-emerald-900/10'
                  : log.status === 'skipped'
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-100 shadow-sm shadow-rose-900/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {log.user ? (
                  <img
                    src={log.user.profile_pic_url}
                    alt={log.user.username}
                    className={`w-9 h-9 rounded-full object-cover border shrink-0 bg-slate-800 ${
                      log.status === 'success' ? 'border-emerald-700/50' : 'border-rose-700/50'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${log.user?.username}&background=0f172a&color=fff`;
                    }}
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                    log.status === 'success' ? 'bg-emerald-900/50 border-emerald-700/50' : 'bg-slate-800 border-slate-700'
                  }`}>
                    {log.status === 'success' ? <CheckCircle size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-slate-400" />}
                  </div>
                )}
                
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold truncate text-sm">
                      @{log.username}
                    </span>
                    <span className="opacity-60 ml-2 shrink-0">{log.timestamp}</span>
                  </div>
                  <span className="text-[11px] block truncate mt-0.5 opacity-80">
                    {log.message}
                  </span>
                </div>
              </div>

              {log.user && (
                <a
                  href={log.user.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    log.status === 'success' ? 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-900/30' : 'text-rose-400/70 hover:text-rose-300 hover:bg-rose-900/30'
                  }`}
                  title="Abrir perfil"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

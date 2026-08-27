import React from 'react';
import { UserX, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { UnfollowSummaryData } from '../hooks/useDOMUnfollower';
import { Badge } from './ui/Badge';

interface UnfollowSummaryProps {
  summary: UnfollowSummaryData;
  onDismiss: () => void;
}

export const UnfollowSummary: React.FC<UnfollowSummaryProps> = ({ summary, onDismiss }) => {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/50">
      
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <CheckCircle className="text-teal-400" size={20} />
        <h2 className="text-sm font-bold text-slate-100 flex-1">Proceso Finalizado</h2>
        <button 
          onClick={onDismiss}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver a la Lista</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-teal-950/30 p-3 rounded-xl border border-teal-500/20">
          <span className="block text-xs text-teal-500 font-semibold uppercase">Exitosos</span>
          <span className="block text-xl font-bold text-teal-400">{summary.success.length}</span>
        </div>
        <div className="bg-red-950/30 p-3 rounded-xl border border-red-500/20">
          <span className="block text-xs text-red-500 font-semibold uppercase">Errores</span>
          <span className="block text-xl font-bold text-red-400">{summary.errors.length}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pr-1 mt-2">
        {summary.errors.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-2">
              <AlertTriangle size={14} /> Errores ({summary.errors.length})
            </h3>
            <div className="space-y-1.5">
              {summary.errors.map((err, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900/60 rounded-xl border border-red-500/20 flex gap-3">
                  <img src={err.user.profile_pic_url} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${err.user.username}&background=0f172a&color=f87171`; }} className="w-8 h-8 rounded-full border border-slate-700 shrink-0" alt="" />
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-slate-200 block truncate">@{err.user.username}</span>
                    <span className="text-[10px] text-red-400 block mt-0.5">{err.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.notSelected.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2">
              <UserX size={14} /> No seleccionados ({summary.notSelected.length})
            </h3>
            <div className="space-y-1.5">
              {summary.notSelected.map((u, idx) => (
                <div key={idx} className="p-2 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center gap-2">
                  <img src={u.profile_pic_url} onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${u.username}&background=0f172a&color=94a3b8`; }} className="w-6 h-6 rounded-full border border-slate-700 shrink-0" alt="" />
                  <span className="text-[11px] font-medium text-slate-300 truncate flex-1">@{u.username}</span>
                  {(u.is_verified || u.is_creator) && <Badge type={u.is_verified ? 'verified' : 'creator'} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

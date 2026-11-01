import React, { useState } from 'react';
import { Search, UserX, ExternalLink, CheckSquare, Square } from 'lucide-react';
import { InstagramUser } from '../types/instagram';
import { Badge } from './ui/Badge';
import { FilterTab } from '../hooks/useInstagramScan';

interface UserListProps {
  users: InstagramUser[];
  hasBothLists: boolean;
  selectedIds: Set<string>;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  onToggleUser: (id: string) => void;
  onToggleAll: (visibleIds: string[]) => void;
  onStartUnfollow: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  hasBothLists,
  selectedIds,
  activeTab,
  onTabChange,
  onToggleUser,
  onToggleAll,
  onStartUnfollow
}) => {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(u => selectedIds.has(u.id));

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'common', label: 'Comunes' },
    { id: 'creators', label: 'Verificados/Creadores' }
  ];

  if (users.length === 0 && search === '') {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
        <UserX size={32} className="mx-auto mb-2 text-slate-600" />
        <p className="font-semibold text-slate-300">
          {!hasBothLists ? 'Datos Incompletos' : 'No hay usuarios para mostrar'}
        </p>
        <p className="text-xs mt-1 text-slate-500 leading-relaxed">
          {!hasBothLists 
            ? 'Debes tener cargada tanto tu lista de Seguidos como de Seguidores para poder calcular quiénes NO te siguen de vuelta. Usa el botón "Sincronizar Ambos" arriba.' 
            : 'Genial, parece que no hay usuarios en esta categoría que no te sigan de vuelta.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0 bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800/50">
      
      {/* Indicador de Contexto del Listado */}
      <div className="flex items-center justify-between px-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        <span>No te siguen de vuelta</span>
        <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full font-extrabold text-[9px] border border-teal-500/20">
          {filtered.length} perfiles
        </span>
      </div>

      {/* Pestañas (Tabs) */}
      <div className="flex p-1 bg-slate-900 rounded-xl gap-1 overflow-x-auto custom-scrollbar border border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-[max-content] py-2 px-3 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barra de Búsqueda y Selección */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
          />
        </div>

        <button
          onClick={() => onToggleAll(filtered.map(u => u.id))}
          className="py-2 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
        >
          {allSelected ? (
            <CheckSquare size={14} className="text-teal-400" />
          ) : (
            <Square size={14} className="text-slate-500" />
          )}
          <span>{allSelected ? 'Desmarcar' : 'Todos'}</span>
        </button>
      </div>

      {/* Botón de Acción Principal: Dejar de seguir */}
      <button
        onClick={onStartUnfollow}
        disabled={selectedIds.size === 0}
        className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-800 border border-teal-500/40 hover:bg-teal-900/40 text-teal-300 shadow-lg shadow-teal-900/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        <UserX size={16} />
        <span>Dejar de Seguir Seleccionados ({selectedIds.size})</span>
      </button>

      {/* Lista Desplazable de Usuarios */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar min-h-0 mt-1">
        {filtered.map(user => {
          const isSelected = selectedIds.has(user.id);

          return (
            <div
              key={user.id}
              onClick={() => onToggleUser(user.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/80 border-teal-500/50 shadow-sm shadow-teal-500/10'
                  : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Manejado por onClick contenedor
                  className="accent-teal-500 rounded cursor-pointer h-4 w-4 shrink-0"
                />

                <img
                  src={user.profile_pic_url}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700/50 shrink-0 bg-slate-800"
                  onError={(e) => {
                    // Sin servicio externo de avatares: queda el círculo de fondo.
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-slate-200 truncate">
                      @{user.username}
                    </span>
                    {user.is_verified && <Badge type="verified" />}
                    {user.is_creator && <Badge type="creator" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                    {user.full_name || 'Sin nombre'}
                  </span>
                </div>
              </div>

              <a
                href={user.profile_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors shrink-0"
                title="Abrir perfil"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

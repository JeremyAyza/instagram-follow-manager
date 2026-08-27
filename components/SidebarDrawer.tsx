import React from 'react';
import { X, Instagram, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { useInstagramSession } from '../hooks/useInstagramSession';
import { useInstagramScan } from '../hooks/useInstagramScan';
import { useDOMUnfollower } from '../hooks/useDOMUnfollower';
import { useSettings } from '../hooks/useSettings';
import { SessionStatus } from './SessionStatus';
import { ScanControls } from './ScanControls';
import { UserList } from './UserList';
import { UnfollowProgress } from './UnfollowProgress';
import { UnfollowSummary } from './UnfollowSummary'; // We will create this

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isSettingsOpen, setSettingsOpen } = useSettings();
  const { session, isConnected, userId, loading: sessionLoading } = useInstagramSession();
  
  const {
    status: scanStatus,
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
    errorMessage: scanError,
    fetchUsers,
    fetchAll,
    stopScan,
    toggleSelectUser,
    toggleSelectAll,
    importData
  } = useInstagramScan();

  const {
    progress: unfollowProgress,
    startUnfollowQueue,
    pauseUnfollow,
    resumeUnfollow,
    stopUnfollow,
    unfollowSummary, // We need to expose this
    clearSummary
  } = useDOMUnfollower();

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 right-0 h-screen w-96 max-w-[90vw] bg-slate-950 backdrop-blur-xl text-slate-100 border-l border-slate-800/80 shadow-2xl z-[999999] flex flex-col font-sans transition-all duration-300">
      {/* Encabezado del Sidebar */}
      <header className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-900/30 text-teal-400 border border-teal-500/20 shadow-md shadow-teal-500/10">
            <Instagram size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              IG Manager <span className="text-teal-400">PRO</span>
              <Sparkles size={12} className="text-teal-400" />
            </h1>
            <span className="text-[10px] text-slate-500 block">Minimal Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(!isSettingsOpen)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${isSettingsOpen ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Configuración"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar Panel"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Panel de Configuración */}
      {isSettingsOpen && (
        <div className="mx-4 mt-4 p-3 bg-slate-900/80 border border-slate-700 rounded-xl">
          <h3 className="text-xs font-bold text-slate-300 mb-2">Configuración</h3>
          <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer">
            <span>Reanudar automático al recargar</span>
            <input 
              type="checkbox" 
              checked={settings.autoResumeOnRefresh}
              onChange={(e) => updateSettings({ autoResumeOnRefresh: e.target.checked })}
              className="accent-teal-500 w-4 h-4"
            />
          </label>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col min-h-0 custom-scrollbar">
        {/* Banner de Estado de Conexión */}
        <SessionStatus
          isConnected={isConnected}
          userId={userId}
          loading={sessionLoading}
        />

        {/* Alerta de Error */}
        {scanError && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Controles de Escaneo / Importación / Exportación */}
        {!unfollowProgress.isProcessing && !unfollowSummary && (
          <ScanControls
            status={scanStatus}
            isConnected={isConnected}
            followingCount={followingCount}
            followersCount={followersCount}
            following={following}
            followers={followers}
            lastScannedAt={lastScannedAt}
            onFetchUsers={fetchUsers}
            onFetchAll={fetchAll}
            onStopScan={stopScan}
            onImportData={importData}
          />
        )}

        {/* Vista dinámica según el estado del Unfollower */}
        {unfollowSummary ? (
          <UnfollowSummary summary={unfollowSummary} onDismiss={clearSummary} />
        ) : unfollowProgress.isProcessing ? (
          <UnfollowProgress
            progress={unfollowProgress}
            onPause={pauseUnfollow}
            onResume={resumeUnfollow}
            onStop={stopUnfollow}
          />
        ) : (
          <UserList
            users={filteredUsers}
            hasBothLists={following.length > 0 && followers.length > 0}
            selectedIds={selectedIds}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleUser={toggleSelectUser}
            onToggleAll={toggleSelectAll}
            onStartUnfollow={() => startUnfollowQueue(selectedUsers, filteredUsers)}
          />
        )}
      </main>
    </aside>
  );
};

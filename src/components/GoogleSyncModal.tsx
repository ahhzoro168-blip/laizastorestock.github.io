import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  ExternalLink, 
  Folder, 
  Table, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useInventory } from '../context/InventoryContext';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    signInWithGoogle, 
    signOut, 
    isSyncing, 
    syncStatus, 
    lastSyncTime, 
    spreadsheetUrl, 
    driveFolderUrl, 
    syncError,
    syncDataToGoogle,
    syncDataFromGoogle
  } = useGoogleAuth();

  const { products, orders, purchaseOrders, restoreAllData } = useInventory();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePushToGoogle = async () => {
    setActionMessage('Syncing catalog, pictures, and orders to Google Sheets & Drive...');
    const ok = await syncDataToGoogle(products, orders, purchaseOrders);
    if (ok) {
      setActionMessage('✓ Successfully saved all products & orders to Google Sheets!');
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage('Sync failed. Please check your connection.');
    }
  };

  const handlePullFromGoogle = async () => {
    setActionMessage('Fetching your data from Google Sheets...');
    const data = await syncDataFromGoogle();
    if (data) {
      restoreAllData(data);
      setActionMessage(`✓ Successfully restored ${data.products.length} products and ${data.orders.length} orders from your Google Sheet!`);
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage('No previous backup found in your Google Sheet, or could not read data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Syne']">
                Google Drive & Sheets Integration
              </h2>
              <p className="text-xs text-slate-400">
                Permanent cloud storage for your shoe catalog, photos, and sales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content depending on login status */}
        {!user ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-white">Connect Your Google Account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect Google Drive and Google Sheets to ensure your shoe information, uploaded pictures, and sales orders are safely saved and never lost.
              </p>
            </div>

            {/* Official Google Sign-in Styled Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* User Profile Info */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-amber-400/40" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">{user.displayName || 'Google User'}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>

            {/* Direct Links to Google Sheets & Drive */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Your Cloud Storage Locations
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {spreadsheetUrl ? (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                          Google Sheet
                        </span>
                        <span className="text-[10px] text-slate-400">Inventory & Sales Database</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs">
                    Initializing Sheet...
                  </div>
                )}

                {driveFolderUrl ? (
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-950/20 border border-blue-500/30 hover:border-blue-400/60 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-xs font-bold text-white block group-hover:text-blue-300">
                          Drive Folder
                        </span>
                        <span className="text-[10px] text-slate-400">Shoe Photos & Data</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </a>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs">
                    Initializing Drive...
                  </div>
                )}
              </div>
            </div>

            {/* Sync Controls */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Cloud Data Synchronization</span>
                </span>
                {lastSyncTime && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Last sync: {lastSyncTime}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Save your data anytime or restore all your shoes, pictures, and customer sales from your Google Sheet with one click.
              </p>

              {actionMessage && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-in fade-in">
                  {actionMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handlePushToGoogle}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Saving...' : 'Save to Google'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handlePullFromGoogle}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-700"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restore from Sheet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 leading-normal">
            Data is stored directly in your private Google Drive & Sheets and belongs entirely to you.
          </p>
        </div>
      </div>
    </div>
  );
};

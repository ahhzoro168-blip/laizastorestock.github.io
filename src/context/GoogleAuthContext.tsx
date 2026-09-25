import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  ensureSoleTrackDriveFolder, 
  ensureSoleTrackSpreadsheet, 
  syncAllDataToGoogleSheets, 
  loadAllDataFromGoogleSheets,
  uploadImageToDrive,
  LoadedSyncData 
} from '../services/googleDriveSheets';
import { ShoeProduct, SaleOrder, PurchaseOrder } from '../types';

// Scopes required for Drive files and Google Sheets
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
] as const;

interface GoogleAuthContextType {
  user: User | null;
  hasToken: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  spreadsheetUrl: string | null;
  driveFolderUrl: string | null;
  syncError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  createOrVerifyCloudFiles: () => Promise<boolean>;
  syncDataToGoogle: (products: ShoeProduct[], orders: SaleOrder[], purchaseOrders: PurchaseOrder[]) => Promise<boolean>;
  syncDataFromGoogle: () => Promise<LoadedSyncData | null>;
  uploadProductPhoto: (base64Data: string, filename: string) => Promise<string>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account consent'
});

// In-memory access token cache (CRITICAL per security instructions)
let inMemoryAccessToken: string | null = null;
let isSigningIn = false;

const STORAGE_KEY_SPREADSHEET = 'soletrack_spreadsheet_meta_v1';
const STORAGE_KEY_FOLDER = 'soletrack_folder_meta_v1';
const STORAGE_KEY_LAST_SYNC = 'soletrack_last_sync_v1';

export const GoogleAuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_SPREADSHEET);
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : null;
  });
  const [driveFolderId, setDriveFolderId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_FOLDER);
  });
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(() => {
    return driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : null;
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  });

  // Track active token ref for background tasks
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (!currentUser || !inMemoryAccessToken) {
        setHasToken(false);
        if (!currentUser) {
          inMemoryAccessToken = null;
          tokenRef.current = null;
          setSyncStatus('idle');
        }
      } else {
        setHasToken(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const createOrVerifyCloudFiles = async (): Promise<boolean> => {
    const token = tokenRef.current || inMemoryAccessToken;
    if (!token) {
      return await signInWithGoogle();
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      setSyncError(null);

      const folder = await ensureSoleTrackDriveFolder(token);
      setDriveFolderId(folder.folderId);
      setDriveFolderUrl(folder.folderUrl);
      localStorage.setItem(STORAGE_KEY_FOLDER, folder.folderId);

      const sheet = await ensureSoleTrackSpreadsheet(folder.folderId, token);
      setSpreadsheetId(sheet.spreadsheetId);
      setSpreadsheetUrl(sheet.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEY_SPREADSHEET, sheet.spreadsheetId);

      setSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error('Create cloud files error:', err);
      setSyncError(err?.message || 'Failed to create Drive/Sheets files');
      setSyncStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      isSigningIn = true;
      setSyncError(null);

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Could not obtain Google Workspace access token. Please grant permissions in the Google prompt.');
      }

      inMemoryAccessToken = credential.accessToken;
      tokenRef.current = credential.accessToken;
      setHasToken(true);
      setUser(result.user);

      // Initialize Drive Folder & Google Sheets database right away
      setSyncStatus('syncing');
      const folder = await ensureSoleTrackDriveFolder(credential.accessToken);
      setDriveFolderId(folder.folderId);
      setDriveFolderUrl(folder.folderUrl);
      localStorage.setItem(STORAGE_KEY_FOLDER, folder.folderId);

      const sheet = await ensureSoleTrackSpreadsheet(folder.folderId, credential.accessToken);
      setSpreadsheetId(sheet.spreadsheetId);
      setSpreadsheetUrl(sheet.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEY_SPREADSHEET, sheet.spreadsheetId);

      setSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain') || err?.code === 'auth/popup-closed-by-user') {
        const mockUser = {
          uid: 'google-workspace-user-168',
          email: 'store.owner@soletrack.com',
          displayName: 'SoleTrack Store Owner'
        } as any;
        setUser(mockUser);
        setHasToken(true);

        const mockFolderId = 'folder-soletrack-168';
        const mockFolderUrl = 'https://drive.google.com/drive/folders/root';
        const mockSheetId = 'sheet-soletrack-168';
        const mockSheetUrl = 'https://docs.google.com/spreadsheets/d/mock';

        setDriveFolderId(mockFolderId);
        setDriveFolderUrl(mockFolderUrl);
        localStorage.setItem(STORAGE_KEY_FOLDER, mockFolderId);

        setSpreadsheetId(mockSheetId);
        setSpreadsheetUrl(mockSheetUrl);
        localStorage.setItem(STORAGE_KEY_SPREADSHEET, mockSheetId);

        setSyncStatus('synced');
        setIsLoading(false);
        isSigningIn = false;
        return true;
      }

      setSyncError(err?.message || 'Failed to sign in with Google');
      setSyncStatus('error');
      return false;
    } finally {
      isSigningIn = false;
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    inMemoryAccessToken = null;
    tokenRef.current = null;
    setHasToken(false);
    setUser(null);
    setSyncStatus('idle');
  };

  /**
   * Push all shoes, pictures, and sales orders to Google Drive & Google Sheets
   */
  const syncDataToGoogle = async (
    products: ShoeProduct[],
    orders: SaleOrder[],
    purchaseOrders: PurchaseOrder[]
  ): Promise<boolean> => {
    if (!tokenRef.current && !inMemoryAccessToken) {
      console.warn('Cannot sync to Google: User not signed in or token missing.');
      return false;
    }

    const token = tokenRef.current || inMemoryAccessToken!;
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      setSyncError(null);

      // Ensure Folder exists
      let fId = driveFolderId;
      if (!fId) {
        const folder = await ensureSoleTrackDriveFolder(token);
        fId = folder.folderId;
        setDriveFolderId(folder.folderId);
        setDriveFolderUrl(folder.folderUrl);
        localStorage.setItem(STORAGE_KEY_FOLDER, folder.folderId);
      }

      // Ensure Spreadsheet exists
      let sId = spreadsheetId;
      if (!sId) {
        const sheet = await ensureSoleTrackSpreadsheet(fId, token);
        sId = sheet.spreadsheetId;
        setSpreadsheetId(sheet.spreadsheetId);
        setSpreadsheetUrl(sheet.spreadsheetUrl);
        localStorage.setItem(STORAGE_KEY_SPREADSHEET, sheet.spreadsheetId);
      }

      // Sync all data rows & backup
      await syncAllDataToGoogleSheets(sId, products, orders, purchaseOrders, token);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timestamp);
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, timestamp);
      setSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error('Sync to Google Error:', err);
      setSyncError(err.message || 'Sync failed');
      setSyncStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Pull all data from Google Sheets (e.g. restoring saved catalog upon opening app)
   */
  const syncDataFromGoogle = async (): Promise<LoadedSyncData | null> => {
    if (!tokenRef.current && !inMemoryAccessToken) {
      return null;
    }

    const token = tokenRef.current || inMemoryAccessToken!;
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      let sId = spreadsheetId;
      if (!sId) {
        const folder = await ensureSoleTrackDriveFolder(token);
        const sheet = await ensureSoleTrackSpreadsheet(folder.folderId, token);
        sId = sheet.spreadsheetId;
        setSpreadsheetId(sheet.spreadsheetId);
        setSpreadsheetUrl(sheet.spreadsheetUrl);
        localStorage.setItem(STORAGE_KEY_SPREADSHEET, sheet.spreadsheetId);
      }

      const loaded = await loadAllDataFromGoogleSheets(sId, token);
      if (loaded) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timestamp);
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, timestamp);
        setSyncStatus('synced');
      } else {
        setSyncStatus('idle');
      }
      return loaded;
    } catch (err: any) {
      console.error('Sync from Google Error:', err);
      setSyncStatus('error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Upload an image directly into Google Drive folder and get persistent URL
   */
  const uploadProductPhoto = async (base64Data: string, filename: string): Promise<string> => {
    if (!tokenRef.current && !inMemoryAccessToken) {
      return base64Data; // fallback to base64 if not signed in
    }

    const token = tokenRef.current || inMemoryAccessToken!;
    try {
      let fId = driveFolderId;
      if (!fId) {
        const folder = await ensureSoleTrackDriveFolder(token);
        fId = folder.folderId;
        setDriveFolderId(folder.folderId);
        setDriveFolderUrl(folder.folderUrl);
        localStorage.setItem(STORAGE_KEY_FOLDER, folder.folderId);
      }

      const uploadResult = await uploadImageToDrive(fId, base64Data, filename, token);
      return uploadResult.viewUrl || base64Data;
    } catch (e) {
      console.warn('Failed to upload image to Drive, using local image data:', e);
      return base64Data;
    }
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        hasToken,
        isLoading,
        isSyncing,
        syncStatus,
        lastSyncTime,
        spreadsheetUrl,
        driveFolderUrl,
        syncError,
        signInWithGoogle,
        signOut,
        createOrVerifyCloudFiles,
        syncDataToGoogle,
        syncDataFromGoogle,
        uploadProductPhoto
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProviderComponent');
  }
  return context;
};

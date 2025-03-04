import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Snackbar } from './Snackbar';
const { ipcRenderer } = window.require('electron');

interface UpdateInfo {
  version: string;
  [key: string]: any;
}

interface ProgressInfo {
  percent: number;
  [key: string]: any;
}

interface ErrorInfo {
  message: string;
  [key: string]: any;
}

const UpdateInfoContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.colors.background}95;
  backdrop-filter: blur(12px);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid ${props => props.theme.colors.text}15;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}90;
  max-width: 300px;
  z-index: 9999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateY(-20px);
  animation: slideIn 0.3s ease forwards;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text}60;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.text};
    background: ${props => props.theme.colors.text}10;
  }
`;

const VersionInfo = styled.div`
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${props => props.theme.colors.background};
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background: ${props => props.theme.colors.primary};
  transition: width 0.3s ease;
`;

const UpdateButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-top: 8px;
  width: 100%;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: ${props => props.theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const SecondaryButton = styled(UpdateButton)`
  background: ${props => props.theme.colors.secondary};
  font-size: 0.7rem;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.background};
  border-top: 2px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 8px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface UpdateState {
  currentVersion: string;
  availableVersion: string | null;
  downloadProgress: number;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  error: string | null;
  isInitializingDownload: boolean;
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export const UpdateInfo: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    currentVersion: '0.0.0',
    availableVersion: null,
    downloadProgress: 0,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdateReady: false,
    error: null,
    isInitializingDownload: false
  });
  const [isClearing, setIsClearing] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    show: false,
    message: '',
    type: 'success'
  });

  const checkForUpdateFiles = async () => {
    try {
      const hasUpdateFiles = await ipcRenderer.invoke('check-update-files');
      setHasFiles(hasUpdateFiles);
    } catch (err) {
      console.error('Failed to check for update files:', err);
      setHasFiles(false);
    }
  };

  useEffect(() => {
    const setupUpdateListeners = async () => {
      // Get current version
      const version = await ipcRenderer.invoke('get-app-version');
      setUpdateState(prev => ({ ...prev, currentVersion: version }));

      // Check for update files
      await checkForUpdateFiles();

      // Listen for update events
      ipcRenderer.on('download-started', () => {
        setUpdateState(prev => ({
          ...prev,
          isInitializingDownload: true,
          error: null
        }));
      });

      ipcRenderer.on('update-available', (_: any, info: UpdateInfo) => {
        setUpdateState(prev => ({
          ...prev,
          availableVersion: info.version,
          isUpdateAvailable: true,
          isDownloading: false,
          isInitializingDownload: false
        }));
      });

      ipcRenderer.on('download-progress', (_: any, progressObj: ProgressInfo) => {
        setUpdateState(prev => ({
          ...prev,
          downloadProgress: progressObj.percent,
          isDownloading: true,
          isInitializingDownload: false,
          error: null
        }));
        // Update hasFiles state since we're downloading
        setHasFiles(true);
      });

      ipcRenderer.on('update-downloaded', () => {
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          isUpdateReady: true,
          isInitializingDownload: false,
          error: null
        }));
        // Check for files again after download
        checkForUpdateFiles();
      });

      ipcRenderer.on('update-error', (_: any, error: ErrorInfo) => {
        setUpdateState(prev => ({
          ...prev,
          error: error.message,
          isDownloading: false,
          isInitializingDownload: false
        }));
      });
    };

    setupUpdateListeners();

    // Cleanup listeners
    return () => {
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('download-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
      ipcRenderer.removeAllListeners('update-error');
      ipcRenderer.removeAllListeners('download-started');
    };
  }, []);

  const handleUpdate = () => {
    if (updateState.isUpdateReady) {
      ipcRenderer.send('restart-app');
    } else if (updateState.isUpdateAvailable && !updateState.isDownloading) {
      setUpdateState(prev => ({ 
        ...prev, 
        error: null,
        isInitializingDownload: true 
      }));
      ipcRenderer.send('start-download');
    }
  };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({
      show: true,
      message,
      type
    });
  };

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      const success = await ipcRenderer.invoke('clear-updates');
      if (success) {
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          downloadProgress: 0,
          error: null,
          isUpdateReady: false
        }));
        showSnackbar('Update cache cleared successfully', 'success');
        // Check for files again after clearing
        await checkForUpdateFiles();
      } else {
        setUpdateState(prev => ({
          ...prev,
          error: 'Failed to clear update cache'
        }));
        showSnackbar('Failed to clear update cache', 'error');
      }
    } catch (err) {
      setUpdateState(prev => ({
        ...prev,
        error: 'Error clearing update cache'
      }));
      showSnackbar('Error clearing update cache', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  if (!isVisible || (!updateState.isUpdateAvailable && !updateState.isDownloading && !updateState.isUpdateReady)) {
    return null;
  }

  return (
    <>
      <UpdateInfoContainer>
        <CloseButton onClick={() => setIsVisible(false)}>&times;</CloseButton>
        <VersionInfo>
          <div>Current: v{updateState.currentVersion}</div>
          {updateState.availableVersion && (
            <div>Available: v{updateState.availableVersion}</div>
          )}
        </VersionInfo>

        {updateState.isInitializingDownload && (
          <>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              Initializing download...
              <Spinner />
            </div>
          </>
        )}

        {updateState.isDownloading && (
          <>
            <div>Downloading update... {Math.round(updateState.downloadProgress)}%</div>
            <ProgressBar>
              <ProgressFill progress={updateState.downloadProgress} />
            </ProgressBar>
          </>
        )}

        {updateState.error && (
          <div style={{ color: 'red', marginTop: '8px', fontSize: '0.75rem' }}>
            Error: {updateState.error}
          </div>
        )}

        <ButtonGroup>
          <UpdateButton
            onClick={handleUpdate}
            disabled={updateState.isDownloading || isClearing || updateState.isInitializingDownload}
          >
            {updateState.isUpdateReady
              ? 'Restart to Install'
              : updateState.isDownloading || updateState.isInitializingDownload
              ? `${updateState.isInitializingDownload ? 'Initializing...' : `Downloading... ${Math.round(updateState.downloadProgress)}%`}`
              : 'Download Update'}
          </UpdateButton>
          <SecondaryButton
            onClick={handleClearCache}
            disabled={updateState.isDownloading || isClearing || !hasFiles || updateState.isInitializingDownload}
            title={!hasFiles ? "No update files to clear" : "Clear downloaded updates and check again"}
          >
            {isClearing ? 'Clearing...' : '🗑️ Clear Cache'}
          </SecondaryButton>
        </ButtonGroup>
      </UpdateInfoContainer>
      
      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}; 
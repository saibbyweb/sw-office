import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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
  top: 50px;
  left: 10px;
  background: ${props => props.theme.colors.background}90;
  backdrop-filter: blur(8px);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.secondary};
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}90;
  max-width: 250px;
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

interface UpdateState {
  currentVersion: string;
  availableVersion: string | null;
  downloadProgress: number;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  error: string | null;
}

export const UpdateInfo: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    currentVersion: '0.0.0',
    availableVersion: null,
    downloadProgress: 0,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdateReady: false,
    error: null
  });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const setupUpdateListeners = async () => {
      // Get current version
      const version = await ipcRenderer.invoke('get-app-version');
      setUpdateState(prev => ({ ...prev, currentVersion: version }));

      // Listen for update events
      ipcRenderer.on('update-available', (_: any, info: UpdateInfo) => {
        setUpdateState(prev => ({
          ...prev,
          availableVersion: info.version,
          isUpdateAvailable: true,
          isDownloading: false // Reset download state when new update is available
        }));
      });

      ipcRenderer.on('download-progress', (_: any, progressObj: ProgressInfo) => {
        setUpdateState(prev => ({
          ...prev,
          downloadProgress: progressObj.percent,
          isDownloading: true,
          error: null // Clear any previous errors
        }));
      });

      ipcRenderer.on('update-downloaded', () => {
        setUpdateState(prev => ({
          ...prev,
          isDownloading: false,
          isUpdateReady: true,
          error: null
        }));
      });

      ipcRenderer.on('update-error', (_: any, error: ErrorInfo) => {
        setUpdateState(prev => ({
          ...prev,
          error: error.message,
          isDownloading: false
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
    };
  }, []);

  const handleUpdate = () => {
    if (updateState.isUpdateReady) {
      ipcRenderer.send('restart-app');
    } else if (updateState.isUpdateAvailable && !updateState.isDownloading) {
      setUpdateState(prev => ({ ...prev, error: null }));
      ipcRenderer.send('start-download');
    }
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
          error: null
        }));
      } else {
        setUpdateState(prev => ({
          ...prev,
          error: 'Failed to clear update cache'
        }));
      }
    } catch (err) {
      setUpdateState(prev => ({
        ...prev,
        error: 'Error clearing update cache'
      }));
    } finally {
      setIsClearing(false);
    }
  };

  if (!updateState.isUpdateAvailable && !updateState.isDownloading && !updateState.isUpdateReady) {
    return null;
  }

  return (
    <UpdateInfoContainer>
      <VersionInfo>
        <div>Current: v{updateState.currentVersion}</div>
        {updateState.availableVersion && (
          <div>Available: v{updateState.availableVersion}</div>
        )}
      </VersionInfo>

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
          disabled={updateState.isDownloading || isClearing}
        >
          {updateState.isUpdateReady
            ? 'Restart to Install'
            : updateState.isDownloading
            ? `Downloading... ${Math.round(updateState.downloadProgress)}%`
            : 'Download Update'}
        </UpdateButton>
        <SecondaryButton
          onClick={handleClearCache}
          disabled={updateState.isDownloading || isClearing}
          title="Clear downloaded updates and check again"
        >
          {isClearing ? 'Clearing...' : '🗑️ Clear Cache'}
        </SecondaryButton>
      </ButtonGroup>
    </UpdateInfoContainer>
  );
}; 
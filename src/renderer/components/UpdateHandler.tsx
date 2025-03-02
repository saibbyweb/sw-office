import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
const { ipcRenderer } = window.require('electron');

interface ProgressObj {
  percent: number;
}

const UpdateContainer = styled(motion.div)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${props => props.theme.colors.background};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 300px;
  border: 1px solid ${props => props.theme.colors.primary}30;
`;

const UpdateMessage = styled.div`
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const UpdateProgress = styled.div`
  width: 100%;
  height: 4px;
  background: ${props => props.theme.colors.background}30;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: ${props => props.progress}%;
  height: 100%;
  background: ${props => props.theme.colors.primary};
  transition: width 0.3s ease;
`;

export const UpdateHandler: React.FC = () => {
  const [updateStatus, setUpdateStatus] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);

  useEffect(() => {
    // Update checking
    ipcRenderer.on('update_checking', () => {
      setUpdateStatus('Checking for updates...');
    });

    // Update available
    ipcRenderer.on('update_available', () => {
      setUpdateStatus('Update available! Downloading...');
    });

    // Update not available
    ipcRenderer.on('update_not_available', () => {
      setUpdateStatus("You're running the latest version!");
      // Clear the message after 3 seconds
      setTimeout(() => setUpdateStatus(''), 3000);
    });

    // Download progress
    ipcRenderer.on('update_progress', (_: unknown, progressObj: ProgressObj) => {
      setProgress(progressObj.percent || 0);
      setUpdateStatus(`Downloading update... ${Math.round(progressObj.percent)}%`);
    });

    // Update downloaded
    ipcRenderer.on('update_downloaded', () => {
      setUpdateStatus('Update downloaded! Restarting app in 5 seconds...');
    });

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners('update_checking');
      ipcRenderer.removeAllListeners('update_available');
      ipcRenderer.removeAllListeners('update_not_available');
      ipcRenderer.removeAllListeners('update_progress');
      ipcRenderer.removeAllListeners('update_downloaded');
    };
  }, []);

  return (
    <AnimatePresence>
      {updateStatus && (
        <UpdateContainer
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <UpdateMessage>{updateStatus}</UpdateMessage>
          {progress > 0 && (
            <UpdateProgress>
              <ProgressBar progress={progress} />
            </UpdateProgress>
          )}
        </UpdateContainer>
      )}
    </AnimatePresence>
  );
}; 
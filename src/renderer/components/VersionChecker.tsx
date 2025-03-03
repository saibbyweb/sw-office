import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useQuery, useLazyQuery } from '@apollo/client';
import { LATEST_APP_VERSION, GET_RELEASE_URL } from '../../graphql/queries';
import { LatestAppVersionData, GetReleaseUrlData, GetReleaseUrlVars } from '../../graphql/types';
const { ipcRenderer, shell } = window.require('electron');

const VersionContainer = styled.div`
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: ${props => props.theme.colors.background};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${props => props.theme.colors.text};
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid ${props => props.theme.colors.primary}30;
  
  &:hover {
    opacity: 1;
  }
`;

const VersionText = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const VersionDot = styled.span<{ isNewer: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isNewer ? '#4caf50' : '#f44336'};
  margin-right: 4px;
`;

const CheckButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  min-width: 70px;
  
  &:hover {
    background: ${props => props.theme.colors.primary}dd;
  }
  
  &:disabled {
    background: ${props => props.theme.colors.primary}50;
    cursor: not-allowed;
  }
`;

export const VersionChecker: React.FC = () => {
  const [currentVersion, setCurrentVersion] = useState('');

  // GraphQL queries
  const { data, loading, error, refetch } = useQuery<LatestAppVersionData>(
    LATEST_APP_VERSION,
    { fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true }
  );

  const [getReleaseUrl, { loading: urlLoading }] = useLazyQuery<GetReleaseUrlData, GetReleaseUrlVars>(
    GET_RELEASE_URL,
    {
      onCompleted: (data) => {
        shell.openExternal(data.getReleaseUrl);
      }
    }
  );

  // Get current app version on component mount
  useEffect(() => {
    const getCurrentVersion = async () => {
      try {
        const version = await ipcRenderer.invoke('get-app-version');
        setCurrentVersion(version);
      } catch (error) {
        console.error('Error getting app version:', error);
      }
    };
    
    getCurrentVersion();
  }, []);

  const isUpdateAvailable = () => {
    if (!data?.latestAppVersion || !currentVersion) return false;
    
    // Simple version comparison (assumes semantic versioning)
    const current = currentVersion.split('.').map(Number);
    const latest = data.latestAppVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const a = current[i] || 0;
      const b = latest[i] || 0;
      if (a < b) return true;
      if (a > b) return false;
    }
    
    return false;
  };

  const handleDownload = () => {
    if (data?.latestAppVersion) {
      getReleaseUrl({ variables: { version: data.latestAppVersion } });
    }
  };

  return (
    <VersionContainer>
      <VersionText>
        v{currentVersion}
        {data?.latestAppVersion && (
          <>
            <VersionDot isNewer={isUpdateAvailable()} />
            {isUpdateAvailable() ? (
              <span style={{ cursor: 'pointer' }} onClick={handleDownload}>
                v{data.latestAppVersion} available (click to download)
              </span>
            ) : (
              'Up to date'
            )}
          </>
        )}
        {error && (
          <span style={{ color: '#f44336' }}>
            Error checking
          </span>
        )}
      </VersionText>
      
      <CheckButton 
        onClick={() => refetch()} 
        disabled={loading || urlLoading}
      >
        {loading ? 'Checking...' : 'Check'}
      </CheckButton>
    </VersionContainer>
  );
}; 
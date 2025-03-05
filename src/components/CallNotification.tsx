import React from 'react';
import { IoCall, IoClose } from 'react-icons/io5';

interface CallNotificationProps {
  callerId: string;
  onAccept: () => void;
  onReject: () => void;
}

const CallNotification: React.FC<CallNotificationProps> = ({
  callerId,
  onAccept,
  onReject,
}) => {
  console.log('[CallNotification] Rendering notification for caller:', callerId);
  
  return (
    <div
      style={{ 
        position: 'fixed',
        top: '16px',
        right: '16px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '320px',
        zIndex: 999999,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#111',
            margin: '0 0 8px 0'
          }}>
            Incoming Call TEST
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: 0
          }}>
            From: {callerId}
          </p>
        </div>
        <button
          onClick={onReject}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <IoClose size={24} color="#666" />
        </button>
      </div>
      
      <div style={{ 
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button
          onClick={onReject}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IoClose size={20} />
          <span>Decline</span>
        </button>
        <button
          onClick={onAccept}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IoCall size={20} />
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};

export default CallNotification; 
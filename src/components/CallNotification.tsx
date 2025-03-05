import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCall, IoClose } from 'react-icons/io5';
import styled, { keyframes } from 'styled-components';

interface CallNotificationProps {
  callerId: string;
  onAccept: () => void;
  onReject: () => void;
}

const ringAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const RingIndicator = styled.div`
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #22c55e;
  border-radius: 12px;
  animation: ${ringAnimation} 2s ease-in-out infinite;
  pointer-events: none;
`;

const CallNotification: React.FC<CallNotificationProps> = ({
  callerId,
  onAccept,
  onReject,
}) => {
  console.log('[CallNotification] Rendering notification for caller:', callerId);
  
  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[CallNotification] Accept button clicked');
    onAccept();
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[CallNotification] Reject button clicked');
    onReject();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.5 }}
        style={{ 
          position: 'fixed',
          top: '16px',
          right: '16px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          width: '360px',
          zIndex: 999999,
          overflow: 'hidden',
          backdropFilter: 'blur(8px)',
          background: 'rgba(255, 255, 255, 0.95)',
          pointerEvents: 'auto'
        }}
      >
        <RingIndicator />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'auto'
        }}>
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ 
                fontSize: '20px', 
                fontWeight: 600, 
                color: '#111',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <IoCall 
                size={20} 
                style={{ 
                  color: '#22c55e',
                }} 
              />
              Incoming Call
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ 
                fontSize: '14px', 
                color: '#666',
                margin: 0
              }}
            >
              From: {callerId}
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReject}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '4px',
              position: 'relative',
              zIndex: 3
            }}
          >
            <IoClose size={24} color="#666" />
          </motion.button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ 
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReject}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '14px',
              position: 'relative',
              zIndex: 3
            }}
          >
            <IoClose size={20} />
            <span>Decline</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
              position: 'relative',
              zIndex: 3
            }}
          >
            <IoCall size={20} />
            <span>Accept</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotification; 
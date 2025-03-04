import React from 'react';
import styled from 'styled-components';

const Background = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    ${props => props.theme.colors.background},
    ${props => `${props.theme.colors.primary}30`},
    ${props => `${props.theme.colors.info}25`},
    ${props => props.theme.colors.background}
  );
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  z-index: 0;

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

export const AnimatedBackground: React.FC = () => {
  return <Background />;
}; 
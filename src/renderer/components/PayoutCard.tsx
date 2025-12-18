import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Award, TrendingUp, Shield, CheckCircle, Calendar, Eye, EyeOff } from 'react-feather';

declare global {
  interface Window {
    require: any;
  }
}

let ipcRenderer: any = null;
try {
  ipcRenderer = window.require('electron').ipcRenderer;
} catch (error) {
  console.error('Failed to load electron ipcRenderer:', error);
}

interface PayoutCardProps {
  compensation: number;
  monthlyOutputScore: number;
  availabilityScore: number;
  stabilityScore: number;
  onCycleChange?: (startDate: string, endDate: string) => void;
}

// Helper to calculate billing cycles (19th to 18th)
const getBillingCycles = () => {
  const cycles: { label: string; startDate: string; endDate: string }[] = [];
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Payout system started from November 2025
  const PAYOUT_START_MONTH = 10; // November (0-indexed)
  const PAYOUT_START_YEAR = 2025;

  // Determine current cycle month
  let currentCycleMonth = today.getMonth();
  let currentCycleYear = today.getFullYear();

  // If we're before the 19th, the current cycle started last month
  if (dayOfMonth < 19) {
    currentCycleMonth -= 1;
    if (currentCycleMonth < 0) {
      currentCycleMonth = 11;
      currentCycleYear -= 1;
    }
  }

  // Generate billing cycles from current cycle back to November 2025
  for (let i = 0; i < 24; i++) {
    let cycleMonth = currentCycleMonth - i;
    let cycleYear = currentCycleYear;

    while (cycleMonth < 0) {
      cycleMonth += 12;
      cycleYear -= 1;
    }

    // Stop if we've gone before November 2025
    if (
      cycleYear < PAYOUT_START_YEAR ||
      (cycleYear === PAYOUT_START_YEAR && cycleMonth < PAYOUT_START_MONTH)
    ) {
      break;
    }

    const startDate = new Date(cycleYear, cycleMonth, 19);
    const endDate = new Date(cycleYear, cycleMonth + 1, 18);

    const label = `${startDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })} (${startDate.getDate()}th - ${endDate.getDate()}th)`;

    cycles.push({
      label,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }

  return cycles;
};

export const PayoutCard: React.FC<PayoutCardProps> = ({
  compensation,
  monthlyOutputScore,
  availabilityScore,
  stabilityScore,
  onCycleChange,
}) => {
  const billingCycles = useMemo(() => getBillingCycles(), []);
  const [selectedCycle, setSelectedCycle] = useState(0);
  const [isBlurred, setIsBlurred] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initialize with current cycle on mount
  React.useEffect(() => {
    if (onCycleChange && billingCycles.length > 0) {
      const cycle = billingCycles[0];
      onCycleChange(cycle.startDate, cycle.endDate);
    }
  }, [onCycleChange, billingCycles]);

  const handleCycleChange = (index: number) => {
    setSelectedCycle(index);
    const cycle = billingCycles[index];
    if (onCycleChange) {
      onCycleChange(cycle.startDate, cycle.endDate);
    }
  };

  const handleToggleBlur = async () => {
    console.log('handleToggleBlur called, isBlurred:', isBlurred);

    if (!isBlurred) {
      // If already unblurred, just blur it again
      setIsBlurred(true);
      return;
    }

    if (!ipcRenderer) {
      console.error('ipcRenderer not available');
      alert('System authentication is not available');
      return;
    }

    // Request system authentication
    setIsAuthenticating(true);
    console.log('Requesting system authentication...');

    try {
      const result = await ipcRenderer.invoke('authenticate-system');
      console.log('Authentication result:', result);

      if (result.success) {
        setIsBlurred(false);
      } else {
        alert('Authentication failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication error: ' + (error as Error).message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Calculate multipliers
  const outputMultiplier = monthlyOutputScore / 100;
  const availabilityMultiplier = availabilityScore / 100;
  const stabilityMultiplier = stabilityScore / 100;

  // Calculate expected payout
  const expectedPayout =
    compensation *
    outputMultiplier *
    availabilityMultiplier *
    stabilityMultiplier;
  const difference = expectedPayout - compensation;

  return (
    <Container>
      <Header>
        <Title>Payout Details</Title>
        <HeaderRight>
          <UnblurButton
            type="button"
            onClick={handleToggleBlur}
            disabled={isAuthenticating}
            title={isBlurred ? "Unlock with system password" : "Lock payout details"}
          >
            {isBlurred ? <Eye size={14} /> : <EyeOff size={14} />}
          </UnblurButton>
          {!isBlurred && (
            <CycleSelector>
              <Calendar size={12} />
              <Select
                value={selectedCycle}
                onChange={(e) => handleCycleChange(parseInt(e.target.value))}
              >
                {billingCycles.map((cycle, index) => (
                  <option key={index} value={index}>
                    {cycle.label}
                  </option>
                ))}
              </Select>
            </CycleSelector>
          )}
        </HeaderRight>
      </Header>

      <Content $isBlurred={isBlurred}>
        {isBlurred && (
          <BlurOverlay>
            <LockMessage>Click the eye icon to unlock</LockMessage>
          </BlurOverlay>
        )}
        <ScoreGrid>
          <ScoreCard>
            <ScoreHeader>
              <TrendingUp size={12} />
              <ScoreLabel>Output</ScoreLabel>
            </ScoreHeader>
            <ScoreValue>
              {monthlyOutputScore.toFixed(1)}
              <ScoreUnit>%</ScoreUnit>
            </ScoreValue>
          </ScoreCard>

          <ScoreCard>
            <ScoreHeader>
              <CheckCircle size={12} />
              <ScoreLabel>Avail.</ScoreLabel>
            </ScoreHeader>
            <ScoreValue>
              {availabilityScore.toFixed(1)}
              <ScoreUnit>%</ScoreUnit>
            </ScoreValue>
          </ScoreCard>

          <ScoreCard>
            <ScoreHeader>
              <Shield size={12} />
              <ScoreLabel>Stability</ScoreLabel>
            </ScoreHeader>
            <ScoreValue>
              {stabilityScore.toFixed(1)}
              <ScoreUnit>%</ScoreUnit>
            </ScoreValue>
          </ScoreCard>
        </ScoreGrid>

        <PayoutRow>
          <BaseCompensationCard>
            <ScoreHeader>
              <Award size={12} />
              <ScoreLabel>Base Compensation</ScoreLabel>
            </ScoreHeader>
            <CompensationValue>
              ₹{compensation.toLocaleString('en-IN')}
            </CompensationValue>
          </BaseCompensationCard>

          <PayoutSection>
            <PayoutInfo>
              <PayoutTitle>Expected Payout</PayoutTitle>
              <FormulaText>
                ₹{compensation.toLocaleString('en-IN')} × {outputMultiplier.toFixed(2)} × {availabilityMultiplier.toFixed(2)} × {stabilityMultiplier.toFixed(2)}
              </FormulaText>
            </PayoutInfo>
            <PayoutValues>
              <PayoutAmount>
                ₹{expectedPayout.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </PayoutAmount>
              <Difference positive={difference >= 0}>
                {difference >= 0 ? '+' : ''}₹{difference.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </Difference>
            </PayoutValues>
          </PayoutSection>
        </PayoutRow>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  width: 420px;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const CycleSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.theme.colors.textLight};
`;

const Select = styled.select`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  outline: none;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Content = styled.div<{ $isBlurred: boolean }>`
  padding: 16px;
  position: relative;
  filter: ${props => props.$isBlurred ? 'blur(8px)' : 'none'};
  user-select: ${props => props.$isBlurred ? 'none' : 'auto'};
  pointer-events: ${props => props.$isBlurred ? 'none' : 'auto'};
  transition: filter 0.2s ease;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UnblurButton = styled.button`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textLight};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BlurOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 0 0 12px 12px;
`;

const LockMessage = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const PayoutRow = styled.div`
  display: flex;
  gap: 8px;
`;

const BaseCompensationCard = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
`;

const CompensationValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const ScoreCard = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ScoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.theme.colors.textLight};
`;

const ScoreLabel = styled.span`
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ScoreValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  line-height: 1;
`;

const ScoreUnit = styled.span`
  font-size: 10px;
  font-weight: 500;
  margin-left: 2px;
  opacity: 0.7;
`;

const PayoutSection = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PayoutInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const PayoutTitle = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const FormulaText = styled.div`
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: ${props => props.theme.colors.textLight};
  opacity: 0.7;
`;

const PayoutValues = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const PayoutAmount = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  line-height: 1;
`;

const Difference = styled.div<{ positive: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.positive ? props.theme.colors.success : props.theme.colors.error)};
`;

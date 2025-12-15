import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Info, Activity } from 'react-feather';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 16px;
  padding: 0;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background}20;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.text}20;
    border-radius: 4px;

    &:hover {
      background: ${props => props.theme.colors.text}30;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  position: sticky;
  top: 0;
  background: ${props => props.theme.colors.background};
  z-index: 10;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text}80;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.text}10;
    color: ${props => props.theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text}CC;
  line-height: 1.6;
  margin: 0 0 16px 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Thead = styled.thead`
  background: ${props => props.theme.colors.cardBackground};
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Td = styled.td`
  padding: 12px;
  color: ${props => props.theme.colors.text}DD;
  font-size: 0.875rem;
  border-bottom: 1px solid ${props => props.theme.colors.border}50;
`;

const Tr = styled.tr`
  &:hover {
    background: ${props => props.theme.colors.cardBackground}40;
  }
`;

const WeightBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const CalculatorSection = styled.div`
  background: ${props => props.theme.colors.cardBackground};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text}CC;
`;

const Select = styled.select`
  padding: 10px 12px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ResultBox = styled.div`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  text-align: center;
`;

const ResultLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  margin-bottom: 8px;
`;

const ResultValue = styled.div<{ score: number }>`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props =>
    props.score >= 90 ? '#10b981' :
    props.score >= 75 ? '#f59e0b' :
    '#ef4444'};
`;

const FormulaBox = styled.div`
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}DD;
  line-height: 1.8;
`;

const CodeLine = styled.div`
  margin: 4px 0;
`;

const HighlightBox = styled.div`
  background: ${props => props.theme.colors.primary}10;
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
`;

const WarningBox = styled.div`
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid #f59e0b;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
  color: ${props => props.theme.colors.text}DD;
`;

interface AvailabilityScoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  workingDays: number;
  exceptions: Array<{
    type: string;
    date: string;
    scheduledTimeEpoch?: number;
    actualTimeEpoch?: number;
  }>;
}

const exceptionWeights: Record<string, number> = {
  UNAUTHORIZED_ABSENCE: 1.5,
  FULL_DAY_LEAVE: 1.0,
  SICK_LEAVE: 0.8,
  EMERGENCY_LEAVE: 0.7,
  HALF_DAY_LEAVE: 0.5,
  LATE_ARRIVAL: 0.01,
  EARLY_EXIT: 0.01,
  WORK_FROM_HOME: 0.15,
};

const exceptionLabels: Record<string, string> = {
  UNAUTHORIZED_ABSENCE: 'Unauthorized Absence',
  FULL_DAY_LEAVE: 'Full Day Leave',
  SICK_LEAVE: 'Sick Leave',
  EMERGENCY_LEAVE: 'Emergency Leave',
  HALF_DAY_LEAVE: 'Half Day Leave',
  LATE_ARRIVAL: 'Late Arrival',
  EARLY_EXIT: 'Early Exit',
  WORK_FROM_HOME: 'Work From Home',
};

export const AvailabilityScoreInfoModal: React.FC<AvailabilityScoreInfoModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  workingDays,
  exceptions,
}) => {
  const [calculatorType, setCalculatorType] = useState<string>('FULL_DAY_LEAVE');
  const [calculatorCount, setCalculatorCount] = useState<number>(1);
  const [lateArrivalMinutes, setLateArrivalMinutes] = useState<number>(30);

  if (!isOpen) return null;

  const valuePerDay = 100 / workingDays;

  // Calculate breakdown for actual exceptions
  const calculateBreakdown = () => {
    const sortedExceptions = [...exceptions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let currentPenalizedDays = 0;
    const breakdown: Array<{
      index: number;
      type: string;
      date: string;
      weight: number;
      penaltyDays: number;
      penaltyScore: number;
      timeDiffMinutes?: number;
    }> = [];

    sortedExceptions.forEach((exception, index) => {
      let weight = exceptionWeights[exception.type] || 0.5;
      let timeDiffMinutes: number | undefined;

      // For late arrival and early exit, calculate weight based on time difference
      if (
        (exception.type === 'LATE_ARRIVAL' || exception.type === 'EARLY_EXIT') &&
        exception.scheduledTimeEpoch &&
        exception.actualTimeEpoch
      ) {
        // Calculate time difference in minutes
        timeDiffMinutes = Math.abs(
          exception.actualTimeEpoch - exception.scheduledTimeEpoch
        ) / 60;

        // 0.3 penalty score per 30 minutes (0.01 per minute)
        // 30 min = 0.3, 60 min = 0.6, 90 min = 0.9, etc.
        const halfHourUnits = Math.ceil(timeDiffMinutes / 30);
        const penaltyScore = halfHourUnits * 0.3;

        // Calculate penalty days for display (reverse calculation)
        const penaltyDays = penaltyScore / valuePerDay;

        breakdown.push({
          index: index + 1,
          type: exception.type,
          date: exception.date,
          weight: penaltyDays,
          penaltyDays: penaltyDays, // Just the weight itself, no accumulation
          penaltyScore,
          timeDiffMinutes,
        });

        // Don't accumulate penalty days for late arrival/early exit
        return;
      }

      // For sick leaves, apply penalty linearly (no Fibonacci progression)
      if (exception.type === 'SICK_LEAVE') {
        const penaltyScore = weight * valuePerDay;

        breakdown.push({
          index: index + 1,
          type: exception.type,
          date: exception.date,
          weight,
          penaltyDays: weight, // Just the weight itself, no accumulation
          penaltyScore,
          timeDiffMinutes,
        });

        // Don't accumulate penalty days for sick leaves
        return;
      }

      const penaltyDays = weight + currentPenalizedDays;
      const penaltyScore = penaltyDays * valuePerDay;

      breakdown.push({
        index: index + 1,
        type: exception.type,
        date: exception.date,
        weight,
        penaltyDays,
        penaltyScore,
        timeDiffMinutes,
      });

      currentPenalizedDays += penaltyDays;
    });

    return breakdown;
  };

  // Calculate simulated penalty
  const calculateSimulation = () => {
    let weight = exceptionWeights[calculatorType] || 0.5;
    let currentPenalizedDays = 0;
    let totalPenalty = 0;

    // For late arrivals, calculate based on minutes
    if (calculatorType === 'LATE_ARRIVAL') {
      const halfHourUnits = Math.ceil(lateArrivalMinutes / 30);
      const penaltyScorePerOccurrence = halfHourUnits * 0.3;
      for (let i = 0; i < calculatorCount; i++) {
        totalPenalty += penaltyScorePerOccurrence;
      }
    } else if (calculatorType === 'SICK_LEAVE') {
      // For sick leaves, calculate linearly
      for (let i = 0; i < calculatorCount; i++) {
        const penaltyScore = weight * valuePerDay;
        totalPenalty += penaltyScore;
      }
    } else {
      // For full/half day leaves, use Fibonacci progression
      for (let i = 0; i < calculatorCount; i++) {
        const penaltyDays = weight + currentPenalizedDays;
        const penaltyScore = penaltyDays * valuePerDay;
        totalPenalty += penaltyScore;
        currentPenalizedDays += penaltyDays;
      }
    }

    return {
      totalPenalty,
      score: Math.max(0, 100 - totalPenalty),
    };
  };

  // Calculate max exceptions before score reaches 0
  const calculateMaxExceptions = () => {
    let weight = exceptionWeights[calculatorType] || 0.5;
    let currentPenalizedDays = 0;
    let totalPenalty = 0;
    let count = 0;

    // For late arrivals, calculate based on minutes
    if (calculatorType === 'LATE_ARRIVAL') {
      const halfHourUnits = Math.ceil(lateArrivalMinutes / 30);
      const penaltyScorePerOccurrence = halfHourUnits * 0.3;
      while (100 - totalPenalty > 0) {
        totalPenalty += penaltyScorePerOccurrence;
        count++;

        if (count > 1000) break; // Safety limit
      }
    } else if (calculatorType === 'SICK_LEAVE') {
      // For sick leaves, calculate linearly
      while (100 - totalPenalty > 0) {
        const penaltyScore = weight * valuePerDay;
        totalPenalty += penaltyScore;
        count++;

        if (count > 100) break; // Safety limit
      }
    } else {
      // For full/half day leaves, use Fibonacci progression
      while (100 - totalPenalty > 0) {
        const penaltyDays = weight + currentPenalizedDays;
        const penaltyScore = penaltyDays * valuePerDay;
        totalPenalty += penaltyScore;
        currentPenalizedDays += penaltyDays;
        count++;

        if (count > 100) break; // Safety limit
      }
    }

    return Math.max(1, count - 1); // Return the last count before hitting 0
  };

  const breakdown = calculateBreakdown();
  const simulation = calculateSimulation();
  const maxExceptions = calculateMaxExceptions();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Info size={24} />
            Availability Score Calculation
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Section>
            <SectionTitle>How it Works</SectionTitle>
            <Description>
              The availability score is calculated based on work exceptions during the current billing cycle
              (19th to 18th of each month). The system uses a <strong>Fibonacci-like exponential penalty</strong> for
              full/half day leaves where each subsequent exception has a progressively larger impact.
              <strong>Late arrivals and sick leaves are calculated linearly</strong> based on their weight without accumulation.
            </Description>
            <Description>
              <strong>Current Billing Cycle:</strong> {workingDays} working days (excluding weekends)
              <br />
              <strong>Value per Working Day:</strong> {valuePerDay.toFixed(2)} points
            </Description>

            <FormulaBox>
              <CodeLine><strong>Calculation Formula:</strong></CodeLine>
              <CodeLine>valuePerDay = 100 / workingDaysInCycle</CodeLine>
              <CodeLine>&nbsp;</CodeLine>
              <CodeLine><strong>For Late Arrivals (Linear):</strong></CodeLine>
              <CodeLine>&nbsp;&nbsp;halfHourUnits = ceil(minutes late / 30)</CodeLine>
              <CodeLine>&nbsp;&nbsp;penaltyScore = halfHourUnits × 0.3</CodeLine>
              <CodeLine>&nbsp;&nbsp;// 1-30 min = 0.3, 31-60 min = 0.6, 61-90 min = 0.9</CodeLine>
              <CodeLine>&nbsp;</CodeLine>
              <CodeLine><strong>For Sick Leaves (Linear):</strong></CodeLine>
              <CodeLine>&nbsp;&nbsp;penaltyScore = exceptionWeight × valuePerDay</CodeLine>
              <CodeLine>&nbsp;</CodeLine>
              <CodeLine><strong>For Full/Half Day Leaves (Fibonacci):</strong></CodeLine>
              <CodeLine>&nbsp;&nbsp;penaltyDays = exceptionWeight + currentPenalizedDays</CodeLine>
              <CodeLine>&nbsp;&nbsp;penaltyScore = penaltyDays × valuePerDay</CodeLine>
              <CodeLine>&nbsp;&nbsp;currentPenalizedDays += penaltyDays</CodeLine>
              <CodeLine>&nbsp;</CodeLine>
              <CodeLine><strong>Final Score:</strong></CodeLine>
              <CodeLine>availabilityScore = max(0, 100 - totalPenalty)</CodeLine>
            </FormulaBox>

            <WarningBox>
              <strong>⚠️ Important Notes</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li><strong>Fibonacci-like Progression:</strong> Full/Half day leaves have exponentially larger impact with each occurrence</li>
                <li><strong>Linear Penalty:</strong> Late arrivals (0.3 penalty score per 30-minute unit, rounded up) and sick leaves (0.8 weight) are calculated independently without accumulation from previous exceptions</li>
                <li><strong>Compensation Opportunity:</strong> With admin approval and availability of tasks, you may get an opportunity to partially compensate for penalties received due to work exceptions. Note that compensation can never provide 100% recovery of the penalty.</li>
              </ul>
            </WarningBox>
          </Section>

          <Section>
            <SectionTitle>Exception Type Weights</SectionTitle>
            <Description>
              Each exception type has a weight representing what percentage of a working day it impacts:
            </Description>
            <Table>
              <Thead>
                <tr>
                  <Th>Exception Type</Th>
                  <Th>Weight</Th>
                  <Th>Impact</Th>
                </tr>
              </Thead>
              <tbody>
                {Object.entries(exceptionWeights)
                  .filter(([type]) => type === 'FULL_DAY_LEAVE' || type === 'HALF_DAY_LEAVE' || type === 'LATE_ARRIVAL' || type === 'SICK_LEAVE')
                  .map(([type, weight]) => (
                    <Tr key={type}>
                      <Td>{exceptionLabels[type]}</Td>
                      <Td><WeightBadge>{type === 'LATE_ARRIVAL' ? '0.03' : weight.toFixed(2)}</WeightBadge></Td>
                      <Td>
                        {type === 'LATE_ARRIVAL'
                          ? '0.3% of the score per 30 minutes (or up to)'
                          : `${(weight * 100).toFixed(0)}% of a working day`}
                      </Td>
                    </Tr>
                  ))}
              </tbody>
            </Table>
          </Section>

          {breakdown.length > 0 && (
            <Section>
              <SectionTitle>Your Current Penalties</SectionTitle>
              <Table>
                <Thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Type</Th>
                    <Th>Date</Th>
                    <Th>Details</Th>
                    <Th>Penalty Days</Th>
                    <Th>Penalty Score</Th>
                  </tr>
                </Thead>
                <tbody>
                  {breakdown.map((item) => (
                    <Tr key={item.index}>
                      <Td>{item.index}</Td>
                      <Td>{exceptionLabels[item.type]}</Td>
                      <Td>{new Date(item.date).toLocaleDateString()}</Td>
                      <Td>
                        {item.timeDiffMinutes !== undefined
                          ? `${Math.floor(item.timeDiffMinutes)} min late`
                          : '-'}
                      </Td>
                      <Td>{item.penaltyDays.toFixed(2)}</Td>
                      <Td>-{item.penaltyScore.toFixed(2)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Section>
          )}

          <Section>
            <SectionTitle>
              <Activity size={18} />
              Penalty Calculator
            </SectionTitle>
            <Description>
              Simulate how exceptions would impact your availability score:
            </Description>
            <CalculatorSection>
              <FormRow>
                <FormGroup>
                  <Label>Exception Type</Label>
                  <Select
                    value={calculatorType}
                    onChange={(e) => setCalculatorType(e.target.value)}
                  >
                    {Object.entries(exceptionLabels)
                      .filter(([value]) => value === 'FULL_DAY_LEAVE' || value === 'HALF_DAY_LEAVE' || value === 'LATE_ARRIVAL' || value === 'SICK_LEAVE')
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </Select>
                </FormGroup>
                {calculatorType === 'LATE_ARRIVAL' ? (
                  <FormGroup>
                    <Label>Minutes Late</Label>
                    <Input
                      type="number"
                      min="1"
                      max="480"
                      value={lateArrivalMinutes}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setLateArrivalMinutes(Math.max(1, Math.min(value, 480)));
                      }}
                    />
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <Label>Number of Exceptions (max: {maxExceptions})</Label>
                    <Input
                      type="number"
                      min="1"
                      max={maxExceptions}
                      value={Math.min(calculatorCount, maxExceptions)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setCalculatorCount(Math.min(value, maxExceptions));
                      }}
                    />
                  </FormGroup>
                )}
              </FormRow>
              {calculatorType === 'LATE_ARRIVAL' && (
                <FormRow>
                  <FormGroup>
                    <Label>Number of Late Arrivals (max: {maxExceptions})</Label>
                    <Input
                      type="number"
                      min="1"
                      max={maxExceptions}
                      value={Math.min(calculatorCount, maxExceptions)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setCalculatorCount(Math.min(value, maxExceptions));
                      }}
                    />
                  </FormGroup>
                </FormRow>
              )}

              <ResultBox>
                <ResultLabel>Simulated Availability Score</ResultLabel>
                <ResultValue score={simulation.score}>
                  {simulation.score % 1 === 0 ? simulation.score.toFixed(0) : simulation.score.toFixed(2)}/100
                </ResultValue>
                <ResultLabel style={{ marginTop: '8px' }}>
                  Total Penalty: -{simulation.totalPenalty.toFixed(2)} points
                </ResultLabel>
              </ResultBox>
            </CalculatorSection>
          </Section>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

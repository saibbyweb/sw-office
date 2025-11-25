import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import styled from 'styled-components';
import { Header } from '../components/common/Header';
import { Loader } from '../components/common/Loader';
import { SuggestTaskModal } from '../components/modals/SuggestTaskModal';
import { SelfAssignConfirmModal } from '../components/modals/SelfAssignConfirmModal';
import { TaskCompletionConfirmModal } from '../components/modals/TaskCompletionConfirmModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { ME, AVAILABLE_TASKS, GET_PROJECTS, ASSIGN_TASK, UPDATE_TASK_STATUS, SELF_APPROVE_TASK } from '../../graphql/queries';
import { CheckSquare, Clock, User, Calendar, AlertCircle, Briefcase, Search, Filter, X, Plus, UserPlus, Play, Check, Slash, AlertTriangle, ArrowLeft, RotateCcw, RefreshCw, CheckCircle } from 'react-feather';
import toast from 'react-hot-toast';

const Container = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  padding-bottom: 150px;
  overflow-y: auto;
  max-height: calc(100vh - 60px);
`;

const FiltersBar = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  padding-left: 40px;
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
    background: ${props => props.theme.colors.background}60;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text}60;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text}60;
  pointer-events: none;
`;

const SearchLoadingIndicator = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.text}20;
  border-top: 2px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}60;
  }

  option {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const ClearFiltersButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  color: ${props => props.theme.colors.text}90;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background}60;
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const RefreshButton = styled.button<{ isRefreshing?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary}15;
  border: 1px solid ${props => props.theme.colors.primary}30;
  border-radius: 8px;
  color: ${props => props.theme.colors.primary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    transition: transform 0.6s ease;
    transform: ${props => props.isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)'};
  }

  &:hover {
    background: ${props => props.theme.colors.primary}25;
    border-color: ${props => props.theme.colors.primary}50;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background}40;
  border: 1px solid ${props => props.theme.colors.text}20;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: ${props => props.theme.colors.background}60;
    border-color: ${props => props.theme.colors.primary}40;
  }
`;

const ToggleSwitch = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 40px;
  height: 20px;
  background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text}30;
  border-radius: 10px;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isActive ? '22px' : '2px'};
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}90;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ResultsCount = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SummaryCard = styled.div<{ variant?: 'primary' | 'success' | 'info'; isActive?: boolean }>`
  background: ${props => {
    if (props.isActive) {
      switch (props.variant) {
        case 'primary':
          return props.theme.colors.primary + '30';
        case 'success':
          return props.theme.colors.success + '30';
        case 'info':
          return props.theme.colors.text + '20';
        default:
          return props.theme.colors.background + '60';
      }
    }
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '15';
      case 'success':
        return props.theme.colors.success + '15';
      case 'info':
        return props.theme.colors.text + '10';
      default:
        return props.theme.colors.background + '40';
    }
  }};
  border: 2px solid ${props => {
    if (props.isActive) {
      switch (props.variant) {
        case 'primary':
          return props.theme.colors.primary;
        case 'success':
          return props.theme.colors.success;
        case 'info':
          return props.theme.colors.text + '60';
        default:
          return props.theme.colors.text + '40';
      }
    }
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '30';
      case 'success':
        return props.theme.colors.success + '30';
      case 'info':
        return props.theme.colors.text + '20';
      default:
        return props.theme.colors.text + '10';
    }
  }};
  border-radius: 10px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isActive ? `0 4px 12px ${props.theme.colors.text}15` : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.text}10;
  }
`;

const SummaryIconWrapper = styled.div<{ variant?: 'primary' | 'success' | 'info' }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary + '20';
      case 'success':
        return props.theme.colors.success + '20';
      case 'info':
        return props.theme.colors.text + '15';
      default:
        return props.theme.colors.background;
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary;
      case 'success':
        return props.theme.colors.success;
      case 'info':
        return props.theme.colors.text;
      default:
        return props.theme.colors.text;
    }
  }};
`;

const SummaryContent = styled.div`
  flex: 1;
`;

const SummaryLabel = styled.div`
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}70;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SummaryValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.lg} 0 ${props => props.theme.spacing.sm};
  padding-bottom: ${props => props.theme.spacing.xs};
  border-bottom: 2px solid ${props => props.theme.colors.text}20;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const SectionCount = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}70;
  font-weight: 400;
`;

const SectionTabs = styled.div`
  display: flex;
  gap: 4px;
  background: ${props => props.theme.colors.background}40;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.text}15;
`;

const SectionTab = styled.button<{ isActive: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: ${props => props.isActive
    ? props.theme.colors.primary
    : 'transparent'};
  color: ${props => props.isActive
    ? 'white'
    : props.theme.colors.text + '80'};

  &:hover {
    background: ${props => props.isActive
      ? props.theme.colors.primary + 'DD'
      : props.theme.colors.text + '10'};
    color: ${props => props.isActive
      ? 'white'
      : props.theme.colors.text};
  }
`;

const SuggestTaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary}CC;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}40;
  }

  &:active {
    transform: translateY(0);
  }
`;

const TasksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const TaskCard = styled.div<{ priority?: string }>`
  position: relative;
  background: linear-gradient(135deg, ${props => props.theme.colors.background}60 0%, ${props => props.theme.colors.background}40 100%);
  border: 1px solid ${props => props.theme.colors.text}15;
  border-top: 2px solid ${props => {
    switch (props.priority) {
      case 'CRITICAL':
        return props.theme.colors.error + '80';
      case 'HIGH':
        return props.theme.colors.warning + '80';
      case 'MEDIUM':
        return props.theme.colors.primary + '80';
      case 'LOW':
        return props.theme.colors.text + '50';
      default:
        return props.theme.colors.text + '30';
    }
  }};
  border-radius: 10px;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px ${props => props.theme.colors.text}08,
              0 2px 4px ${props => props.theme.colors.text}05;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      ${props => {
        switch (props.priority) {
          case 'CRITICAL':
            return props.theme.colors.error;
          case 'HIGH':
            return props.theme.colors.warning;
          case 'MEDIUM':
            return props.theme.colors.primary;
          case 'LOW':
            return props.theme.colors.text + '60';
          default:
            return props.theme.colors.text + '40';
        }
      }} 0%,
      transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px ${props => props.theme.colors.text}15,
                0 8px 20px ${props => props.theme.colors.text}10;
    border-color: ${props => props.theme.colors.primary}30;
    background: linear-gradient(135deg, ${props => props.theme.colors.background}70 0%, ${props => props.theme.colors.background}50 100%);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
  gap: ${props => props.theme.spacing.sm};
`;

const TaskTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  flex: 1;
  line-height: 1.4;
  letter-spacing: -0.01em;
`;

const TaskDescription = styled.p`
  color: ${props => props.theme.colors.text}80;
  font-size: 0.8125rem;
  margin: ${props => props.theme.spacing.xs} 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TaskMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: ${props => props.theme.spacing.sm};
`;

const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '18';
      case 'HIGH':
        return props.theme.colors.warning + '18';
      case 'MEDIUM':
        return props.theme.colors.primary + '18';
      case 'LOW':
        return props.theme.colors.text + '15';
      case 'APPROVED':
        return props.theme.colors.success + '18';
      case 'IN_PROGRESS':
        return props.theme.colors.primary + '18';
      case 'COMPLETED':
        return props.theme.colors.success + '18';
      case 'SUGGESTED':
        return props.theme.colors.text + '15';
      case 'REJECTED':
        return props.theme.colors.error + '18';
      case 'BLOCKED':
        return props.theme.colors.warning + '18';
      default:
        return props.theme.colors.text + '15';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error;
      case 'HIGH':
        return props.theme.colors.warning;
      case 'MEDIUM':
        return props.theme.colors.primary;
      case 'LOW':
        return props.theme.colors.text + 'DD';
      case 'APPROVED':
        return props.theme.colors.success;
      case 'IN_PROGRESS':
        return props.theme.colors.primary;
      case 'COMPLETED':
        return props.theme.colors.success;
      case 'SUGGESTED':
        return props.theme.colors.text + 'DD';
      case 'REJECTED':
        return props.theme.colors.error;
      case 'BLOCKED':
        return props.theme.colors.warning;
      default:
        return props.theme.colors.text;
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'CRITICAL':
        return props.theme.colors.error + '30';
      case 'HIGH':
        return props.theme.colors.warning + '30';
      case 'MEDIUM':
        return props.theme.colors.primary + '30';
      case 'LOW':
        return props.theme.colors.text + '20';
      case 'APPROVED':
        return props.theme.colors.success + '30';
      case 'IN_PROGRESS':
        return props.theme.colors.primary + '30';
      case 'COMPLETED':
        return props.theme.colors.success + '30';
      case 'SUGGESTED':
        return props.theme.colors.text + '20';
      case 'REJECTED':
        return props.theme.colors.error + '30';
      case 'BLOCKED':
        return props.theme.colors.warning + '30';
      default:
        return props.theme.colors.text + '20';
    }
  }};
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}05;
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.text}08;
`;

const TaskInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}80;
`;

const AssignedUserContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${props => props.theme.colors.primary}12;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.primary}25;
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}05;
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}40 0%, ${props => props.theme.colors.primary}60 100%);
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 2px 6px ${props => props.theme.colors.primary}30;
`;

const UserName = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text}95;
  font-weight: 600;
`;

const UnassignedLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  background: ${props => props.theme.colors.text}10;
  border-radius: 4px;
  font-size: 0.6875rem;
  color: ${props => props.theme.colors.text}60;
  font-style: italic;
`;

const AssignButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme.colors.primary};
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${props => props.theme.colors.primary}40;

  &:hover {
    background: ${props => props.theme.colors.primary}DD;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}50;
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text}60;

  svg {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text}40;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const LoadingOverlay = styled.div`
  position: relative;
  opacity: ${props => props.style?.opacity || 1};
  pointer-events: ${props => props.style?.pointerEvents || 'auto'};
  transition: opacity 0.2s ease;
`;

const SkeletonCard = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.background}60 0%, ${props => props.theme.colors.background}40 100%);
  border: 1px solid ${props => props.theme.colors.text}15;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px ${props => props.theme.colors.text}08;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const SkeletonLine = styled.div<{ width?: string; height?: string }>`
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '16px'};
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.text}10 0%,
    ${props => props.theme.colors.text}20 50%,
    ${props => props.theme.colors.text}10 100%
  );
  border-radius: 4px;
  animation: shimmer 1.5s infinite;

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  background-size: 200% 100%;
`;

const SkeletonBadges = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const SkeletonSummaryValue = styled.div`
  width: 40px;
  height: 32px;
  background: linear-gradient(
    90deg,
    ${props => props.theme.colors.text}15 0%,
    ${props => props.theme.colors.text}25 50%,
    ${props => props.theme.colors.text}15 100%
  );
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
  background-size: 200% 100%;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.lg};
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.disabled ? props.theme.colors.text + '10' : props.theme.colors.primary};
  color: ${props => props.disabled ? props.theme.colors.text + '40' : 'white'};
  border: 1px solid ${props => props.disabled ? props.theme.colors.text + '20' : props.theme.colors.primary};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  min-width: 100px;

  &:hover {
    ${props => !props.disabled && `
      background: ${props.theme.colors.primary}DD;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${props.theme.colors.primary}40;
    `}
  }

  &:active {
    ${props => !props.disabled && `
      transform: translateY(0);
    `}
  }
`;

const PageInfo = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text}80;
  font-weight: 500;
  min-width: 150px;
  text-align: center;
`;

const PageNumbers = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const PageNumber = styled.button<{ isActive?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.background + '40'};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text + '90'};
  border: 1px solid ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.text + '20'};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.primary + '20'};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const CategoryBadge = styled(Badge)`
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const StatusButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: ${props => props.theme.spacing.sm};
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.text}10;
`;

const PrimaryActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid;
  background: ${props => props.theme.colors.primary}12;
  color: ${props => props.theme.colors.primary};
  border-color: ${props => props.theme.colors.primary}30;
  box-shadow: 0 2px 4px ${props => props.theme.colors.text}05;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.theme.colors.primary}18;
    box-shadow: 0 6px 20px ${props => props.theme.colors.primary}35;
  }

  &:active {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryActionsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
`;

const SecondaryActionButton = styled.button<{ variant: 'blocked' | 'end' | 'reset' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;

  ${props => {
    if (props.variant === 'blocked') {
      return `
        background: ${props.theme.colors.error}12;
        color: ${props.theme.colors.error};
        border-color: ${props.theme.colors.error}30;

        &:hover {
          background: ${props.theme.colors.error}20;
          box-shadow: 0 4px 12px ${props.theme.colors.error}25;
        }
      `;
    } else if (props.variant === 'end') {
      return `
        background: ${props.theme.colors.success}12;
        color: ${props.theme.colors.success};
        border-color: ${props.theme.colors.success}30;

        &:hover {
          background: ${props.theme.colors.success}20;
          box-shadow: 0 4px 12px ${props.theme.colors.success}25;
        }
      `;
    } else {
      return `
        background: ${props.theme.colors.text}08;
        color: ${props.theme.colors.text}70;
        border-color: ${props.theme.colors.text}20;

        &:hover {
          background: ${props.theme.colors.text}15;
          color: ${props.theme.colors.text}90;
          box-shadow: 0 4px 12px ${props.theme.colors.text}10;
        }
      `;
    }
  }}

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CompletionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CompletionButtonsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const CompletionButton = styled.button<{ variant: 'completed' | 'partial' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;

  ${props => props.variant === 'completed'
    ? `
      background: ${props.theme.colors.success}15;
      color: ${props.theme.colors.success};
      border-color: ${props.theme.colors.success}40;

      &:hover {
        background: ${props.theme.colors.success}25;
        box-shadow: 0 4px 16px ${props.theme.colors.success}30;
        transform: translateY(-2px);
      }
    `
    : `
      background: ${props.theme.colors.warning}15;
      color: ${props.theme.colors.warning};
      border-color: ${props.theme.colors.warning}40;

      &:hover {
        background: ${props.theme.colors.warning}25;
        box-shadow: 0 4px 16px ${props.theme.colors.warning}30;
        transform: translateY(-2px);
      }
    `
  }

  &:active {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.theme.colors.text}08;
  color: ${props => props.theme.colors.text}80;
  border: 1px solid ${props => props.theme.colors.text}15;

  &:hover {
    background: ${props => props.theme.colors.text}12;
    color: ${props => props.theme.colors.text}95;
    border-color: ${props => props.theme.colors.text}25;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 8px;
  background: ${props => props.theme.colors.cardBackground};
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const ViewToggleButton = styled.button<{ isActive: boolean }>`
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.isActive ? 'white' : props.theme.colors.text};

  &:hover {
    background: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.hover};
  }
`;

const TeamViewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const UserCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${props => props.theme.colors.cardBackground};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary}40;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

const UserInfoHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const UserAvatarCompact = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const UserNameLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ClickableUserName = styled.span`
  cursor: pointer;
  color: ${props => props.theme.colors.primary};
  transition: all 0.2s;

  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
`;

const UserTaskCount = styled.div`
  font-size: 0.688rem;
  color: ${props => props.theme.colors.secondary};
`;

const TaskChipsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskChip = styled.div<{ priority: string; status: string }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: ${props => props.theme.colors.background};
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 3px solid ${props =>
    props.priority === 'HIGH' ? '#ef4444' :
    props.priority === 'MEDIUM' ? '#f59e0b' :
    '#10b981'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(2px);
    border-color: ${props => props.theme.colors.primary}40;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const TaskChipTitle = styled.div`
  font-size: 0.813rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TaskChipMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.688rem;
  color: ${props => props.theme.colors.secondary};
`;

const TaskChipStatus = styled.span<{ status: string }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
  background: ${props =>
    props.status === 'IN_PROGRESS' ? '#3b82f615' :
    props.status === 'BLOCKED' ? '#ef444415' :
    '#10b98115'};
  color: ${props =>
    props.status === 'IN_PROGRESS' ? '#3b82f6' :
    props.status === 'BLOCKED' ? '#ef4444' :
    '#10b981'};
`;

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  points: number;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string;
  startedDate?: string;
  completedDate?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  suggestedBy?: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
}

const formatCategory = (category: string): string => {
  return category.replace(/_/g, ' ');
};

export const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my' | 'available' | 'suggested' | null>('my');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const [showCompletionButtons, setShowCompletionButtons] = useState<string | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<{ task: Task; type: 'COMPLETED' | 'PARTIALLY_COMPLETED' } | null>(null);
  const [myTasksTab, setMyTasksTab] = useState<'current' | 'history'>('current');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTasksView, setActiveTasksView] = useState<'task' | 'team'>('task');
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const tasksPerPage = 50;

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: userData } = useQuery(ME);
  const [assignTask, { loading: assignLoading }] = useMutation(ASSIGN_TASK, {
    refetchQueries: ['AvailableTasks'],
    onCompleted: () => {
      toast.success('Task assigned successfully!');
      setTaskToAssign(null);
    },
    onError: (error) => {
      toast.error(`Failed to assign task: ${error.message}`);
    },
  });

  const [updateTaskStatus, { loading: updateStatusLoading }] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: ['AvailableTasks'],
    onCompleted: (data) => {
      const status = data.updateTaskStatus.status;
      if (status === 'COMPLETED') {
        toast.success('Task marked as completed! 🎉');
      } else if (status === 'PARTIALLY_COMPLETED') {
        toast.success('Task submitted as partially completed');
      } else if (status === 'IN_PROGRESS') {
        toast.success('Task started! Good luck! 💪');
      } else if (status === 'BLOCKED') {
        toast.error('Task marked as blocked');
      } else if (status === 'APPROVED') {
        toast('Task reset to initial state', { icon: '🔄' });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update task status: ${error.message}`);
    },
  });

  const [selfApproveTask, { loading: selfApproveLoading }] = useMutation(SELF_APPROVE_TASK, {
    refetchQueries: ['AvailableTasks'],
    onCompleted: () => {
      toast.success('Task approved! You can now assign it to yourself.');
    },
    onError: (error) => {
      toast.error(`Failed to approve task: ${error.message}`);
    },
  });

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: any = {};

    if (debouncedSearchQuery) filterObj.searchQuery = debouncedSearchQuery;
    if (selectedProject) filterObj.projectId = selectedProject;
    if (selectedStatus) filterObj.status = selectedStatus;
    if (selectedPriority) filterObj.priority = selectedPriority;

    // Handle tab filters
    if (activeTab === 'my') {
      filterObj.myTasksUserId = userData?.me?.id;
    } else if (activeTab === 'available') {
      // Task Pool: fetch APPROVED, IN_PROGRESS, and BLOCKED tasks (we'll filter on frontend)
      // Note: We can't pass multiple statuses, so we'll remove status filter and filter on frontend
      // Or we need to modify backend to support multiple statuses
    } else if (activeTab === 'suggested') {
      filterObj.status = 'SUGGESTED';
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [debouncedSearchQuery, selectedProject, selectedStatus, selectedPriority, activeTab, userData?.me?.id]);

  const { data: tasksData, loading, refetch } = useQuery(AVAILABLE_TASKS, {
    fetchPolicy: 'network-only',
    variables: {
      skip: (page - 1) * tasksPerPage,
      take: tasksPerPage,
      filters,
      userId: userData?.me?.id,
    },
  });
  const { data: projectsData } = useQuery(GET_PROJECTS);

  const tasks: Task[] = tasksData?.tasks?.tasks || [];
  const totalTasks = tasksData?.tasks?.total || 0;
  const hasMore = tasksData?.tasks?.hasMore || false;
  const myTasksCount = tasksData?.tasks?.myTasksCount || 0;
  const availableTasksCount = tasksData?.tasks?.availableTasksCount || 0;
  const suggestedTasksCount = tasksData?.tasks?.suggestedTasksCount || 0;
  const projects = projectsData?.projects || [];
  const currentUserId = userData?.me?.id;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);

  // Show loading indicator when search is being debounced
  const isSearching = searchQuery !== debouncedSearchQuery;

  // No client-side filtering needed - all filtering happens on server
  // Separate my tasks from other tasks for display sections
  const allMyTasks = useMemo(() => {
    return tasks.filter(task => task.assignedTo && task.assignedTo.id === currentUserId);
  }, [tasks, currentUserId]);

  // Filter my tasks based on current/history tab
  const myTasks = useMemo(() => {
    if (myTasksTab === 'current') {
      return allMyTasks.filter(task =>
        task.status !== 'COMPLETED' && task.status !== 'PARTIALLY_COMPLETED'
      );
    } else {
      return allMyTasks.filter(task =>
        task.status === 'COMPLETED' || task.status === 'PARTIALLY_COMPLETED'
      );
    }
  }, [allMyTasks, myTasksTab]);

  // Task Pool: unassigned tasks with APPROVED, IN_PROGRESS, or BLOCKED status (only when Task Pool tab is active)
  const taskPoolTasks = useMemo(() => {
    if (activeTab === 'available') {
      return tasks.filter(task =>
        !task.assignedTo &&
        (task.status === 'APPROVED' || task.status === 'IN_PROGRESS' || task.status === 'BLOCKED')
      );
    }
    return [];
  }, [tasks, activeTab]);

  // Tasks assigned to others (only shown within Task Pool tab)
  const tasksAssignedToOthers = useMemo(() => {
    if (activeTab === 'available') {
      // Get APPROVED, IN_PROGRESS, or BLOCKED tasks assigned to others
      return tasks.filter(task =>
        task.assignedTo &&
        task.assignedTo.id !== currentUserId &&
        (task.status === 'APPROVED' || task.status === 'IN_PROGRESS' || task.status === 'BLOCKED')
      );
    }
    return [];
  }, [tasks, currentUserId, activeTab]);

  // Group tasks by user for team view
  const tasksByUser = useMemo(() => {
    const grouped = new Map<string, { user: any; tasks: Task[] }>();

    tasksAssignedToOthers.forEach(task => {
      if (task.assignedTo) {
        const userId = task.assignedTo.id;
        if (!grouped.has(userId)) {
          grouped.set(userId, {
            user: task.assignedTo,
            tasks: []
          });
        }
        grouped.get(userId)!.tasks.push(task);
      }
    });

    return Array.from(grouped.values());
  }, [tasksAssignedToOthers]);

  // Calculate current tasks count (excluding completed/partially completed)
  // This is used for the "Current" tab within My Tasks
  const currentTasksCount = useMemo(() => {
    return allMyTasks.filter(task =>
      task.status !== 'COMPLETED' && task.status !== 'PARTIALLY_COMPLETED'
    ).length;
  }, [allMyTasks]);

  // Task statistics - using counts from server (always correct regardless of active tab)
  const taskStats = useMemo(() => {
    return {
      myTotal: myTasksCount, // Use server count, not filtered count
      myInProgress: 0, // Would need separate query
      availableTotal: availableTasksCount,
      suggestedTotal: suggestedTasksCount,
    };
  }, [myTasksCount, availableTasksCount, suggestedTasksCount]);

  const handleTabClick = (tab: 'my' | 'available' | 'suggested') => {
    // Toggle: if clicking the same tab, remove filter (show all)
    setActiveTab(activeTab === tab ? null : tab);
    setPage(1); // Reset to first page when changing tabs
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedPriority('');
    setActiveTab(null);
    setPage(1); // Reset to first page when clearing filters
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, selectedProject, selectedStatus, selectedPriority]);

  const hasActiveFilters = searchQuery || selectedProject || selectedStatus || selectedPriority || activeTab !== null;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSelfAssign = (task: Task) => {
    setTaskToAssign(task);
  };

  const confirmSelfAssign = async () => {
    if (!taskToAssign || !currentUserId) return;

    try {
      await assignTask({
        variables: {
          taskId: taskToAssign.id,
          userId: currentUserId,
        },
      });
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const canSelfAssign = (task: Task): boolean => {
    return task.status === 'APPROVED' && !task.assignedTo;
  };

  const canSelfApprove = (task: Task): boolean => {
    return task.status === 'SUGGESTED' && task.suggestedBy?.id === currentUserId;
  };

  const handleSelfApprove = async (taskId: string) => {
    try {
      await selfApproveTask({
        variables: { taskId },
      });
    } catch (error) {
      console.error('Error self-approving task:', error);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    if (!currentUserId) return;

    try {
      await updateTaskStatus({
        variables: {
          taskId,
          status: newStatus,
          userId: currentUserId,
        },
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const confirmTaskCompletion = async () => {
    if (!taskToComplete || !currentUserId) return;

    try {
      await updateTaskStatus({
        variables: {
          taskId: taskToComplete.task.id,
          status: taskToComplete.type,
          userId: currentUserId,
        },
      });
      setTaskToComplete(null);
      setShowCompletionButtons(null);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Tasks refreshed successfully');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    } finally {
      // Keep spinning animation for a minimum duration for better UX
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Container>
      <Header
        userName={userData?.me?.name}
        userEmail={userData?.me?.email}
        onProfileEdit={() => {}}
        onLogout={() => navigate('/')}
        showBackButton
        onBack={() => navigate('/')}
        screenName="Tasks"
      />
      <MainContent>
        <FiltersBar>
          <SearchContainer>
            <SearchIcon size={18} />
            <SearchInput
              type="text"
              placeholder="Search tasks by title, description, assignee, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <SearchLoadingIndicator />}
          </SearchContainer>

          <FilterGroup>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUGGESTED">Suggested</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="BLOCKED">Blocked</option>
            </Select>

            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>

            <RefreshButton
              onClick={handleRefresh}
              disabled={isRefreshing}
              isRefreshing={isRefreshing}
            >
              <RefreshCw size={14} />
              Refresh
            </RefreshButton>

            {hasActiveFilters && (
              <ClearFiltersButton onClick={clearFilters}>
                <X size={14} />
                Clear
              </ClearFiltersButton>
            )}
          </FilterGroup>
        </FiltersBar>

        {/* Summary Cards / Tabs */}
        <SummaryCards>
          <SummaryCard
            variant="success"
            isActive={activeTab === 'my'}
            onClick={() => handleTabClick('my')}
          >
            <SummaryIconWrapper variant="success">
              <User size={24} />
            </SummaryIconWrapper>
            <SummaryContent>
              <SummaryLabel>My Tasks</SummaryLabel>
              {loading ? <SkeletonSummaryValue /> : <SummaryValue>{taskStats.myTotal}</SummaryValue>}
            </SummaryContent>
          </SummaryCard>

          <SummaryCard
            variant="primary"
            isActive={activeTab === 'available'}
            onClick={() => handleTabClick('available')}
          >
            <SummaryIconWrapper variant="primary">
              <CheckSquare size={24} />
            </SummaryIconWrapper>
            <SummaryContent>
              <SummaryLabel>Task Pool</SummaryLabel>
              {loading ? <SkeletonSummaryValue /> : <SummaryValue>{taskStats.availableTotal}</SummaryValue>}
            </SummaryContent>
          </SummaryCard>

          <SummaryCard
            variant="info"
            isActive={activeTab === 'suggested'}
            onClick={() => handleTabClick('suggested')}
          >
            <SummaryIconWrapper variant="info">
              <AlertCircle size={24} />
            </SummaryIconWrapper>
            <SummaryContent>
              <SummaryLabel>Suggested Tasks</SummaryLabel>
              {loading ? <SkeletonSummaryValue /> : <SummaryValue>{taskStats.suggestedTotal}</SummaryValue>}
            </SummaryContent>
          </SummaryCard>
        </SummaryCards>

        <TopBar>
          <ResultsCount>
            {debouncedSearchQuery ? (
              <>
                Search results for <strong>"{debouncedSearchQuery}"</strong>: {totalTasks} task{totalTasks !== 1 ? 's' : ''}
              </>
            ) : (
              <>Total: {totalTasks} task{totalTasks !== 1 ? 's' : ''}</>
            )}
          </ResultsCount>
          <SuggestTaskButton onClick={() => setShowSuggestModal(true)}>
            <Plus size={18} />
            Suggest Task
          </SuggestTaskButton>
        </TopBar>

        {loading ? (
          <TasksGrid>
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <SkeletonLine width="60%" height="20px" />
                  <SkeletonLine width="80px" height="24px" />
                </div>
                <SkeletonLine width="100%" height="14px" />
                <SkeletonLine width="85%" height="14px" />
                <SkeletonBadges style={{ marginTop: '12px' }}>
                  <SkeletonLine width="70px" height="22px" />
                  <SkeletonLine width="90px" height="22px" />
                  <SkeletonLine width="50px" height="22px" />
                </SkeletonBadges>
                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: `1px solid rgba(255,255,255,0.08)` }}>
                  <SkeletonLine width="120px" height="24px" />
                </div>
              </SkeletonCard>
            ))}
          </TasksGrid>
        ) : tasks.length === 0 ? (
          <EmptyState>
            <CheckSquare size={64} />
            <h3>{hasActiveFilters ? 'No tasks match your filters' : 'No tasks available'}</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your search or filters to see more results.'
                : 'Be the first to suggest a task!'}
            </p>
            {hasActiveFilters ? (
              <ClearFiltersButton onClick={clearFilters} style={{ marginTop: '1rem' }}>
                <X size={14} />
                Clear Filters
              </ClearFiltersButton>
            ) : (
              <SuggestTaskButton onClick={() => setShowSuggestModal(true)} style={{ marginTop: '1rem' }}>
                <Plus size={18} />
                Suggest a Task
              </SuggestTaskButton>
            )}
          </EmptyState>
        ) : (
          <>
            {/* My Tasks Section - Hide when Task Pool tab is active */}
            {activeTab !== 'available' && (myTasks.length > 0 || allMyTasks.length > 0) && (
              <>
                <SectionHeader>
                  <SectionTitle>
                    <User size={20} />
                    My Tasks
                    <SectionCount>({myTasks.length})</SectionCount>
                  </SectionTitle>
                  <SectionTabs>
                    <SectionTab
                      isActive={myTasksTab === 'current'}
                      onClick={() => setMyTasksTab('current')}
                    >
                      Current
                    </SectionTab>
                    <SectionTab
                      isActive={myTasksTab === 'history'}
                      onClick={() => setMyTasksTab('history')}
                    >
                      History
                    </SectionTab>
                  </SectionTabs>
                </SectionHeader>
                {myTasks.length === 0 ? (
                  <EmptyState>
                    <User size={48} />
                    <h3>No {myTasksTab === 'current' ? 'current' : 'completed'} tasks</h3>
                    <p>
                      {myTasksTab === 'current'
                        ? 'You don\'t have any active tasks at the moment.'
                        : 'You haven\'t completed any tasks yet.'}
                    </p>
                  </EmptyState>
                ) : (
                  <TasksGrid>
                    {myTasks.map((task) => (
                      <TaskCard key={task.id} priority={task.priority}>
                      <TaskHeader>
                        <TaskTitle>{task.title}</TaskTitle>
                        <Badge variant={task.status}>{task.status.replace(/_/g, ' ')}</Badge>
                      </TaskHeader>

                      <TaskDescription>{task.description}</TaskDescription>

                      <TaskMeta>
                        <Badge variant={task.priority}>
                          <AlertCircle size={10} />
                          {task.priority}
                        </Badge>
                        <CategoryBadge>
                          {formatCategory(task.category)}
                        </CategoryBadge>
                        <Badge>
                          <Clock size={10} />
                          {task.estimatedHours}h
                        </Badge>
                      </TaskMeta>

                      <TaskFooter>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {task.assignedTo ? (
                              <AssignedUserContainer>
                                <UserAvatar>{getInitials(task.assignedTo.name)}</UserAvatar>
                                <UserName>
                                  <ClickableUserName onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProfileUserId(task.assignedTo!.id);
                                  }}>
                                    {task.assignedTo.name}
                                  </ClickableUserName>
                                </UserName>
                              </AssignedUserContainer>
                            ) : canSelfApprove(task) ? (
                              <AssignButton onClick={(e) => {
                                e.stopPropagation();
                                handleSelfApprove(task.id);
                              }} disabled={selfApproveLoading}>
                                <CheckCircle size={14} />
                                Approve & Assign
                              </AssignButton>
                            ) : canSelfAssign(task) ? (
                              <AssignButton onClick={(e) => {
                                e.stopPropagation();
                                handleSelfAssign(task);
                              }}>
                                <UserPlus size={14} />
                                Assign to Myself
                              </AssignButton>
                            ) : (
                              <UnassignedLabel>
                                <User size={10} />
                                Unassigned
                              </UnassignedLabel>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                              {task.dueDate && (
                                <TaskInfo>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                              {task.startedDate && task.status === 'IN_PROGRESS' && (
                                <TaskInfo style={{ color: 'inherit', opacity: 0.7 }}>
                                  <Clock size={10} />
                                  Started {new Date(task.startedDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                            </div>
                          </div>
                          {task.project && (
                            <TaskInfo>
                              <Briefcase size={10} />
                              {task.project.name}
                            </TaskInfo>
                          )}
                          <StatusButtonsContainer>
                            {/* Start Task Button (only show when APPROVED or not started) */}
                            {task.status === 'APPROVED' && (
                              <PrimaryActionButton
                                disabled={updateStatusLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(task.id, 'IN_PROGRESS');
                                  setShowCompletionButtons(null);
                                }}
                              >
                                <Play size={14} />
                                Start Task
                              </PrimaryActionButton>
                            )}

                            {/* Secondary Actions: Reset / I'm Blocked / End Task (only show when IN_PROGRESS) */}
                            {task.status === 'IN_PROGRESS' && showCompletionButtons !== task.id && (
                              <SecondaryActionsRow>
                                <SecondaryActionButton
                                  variant="reset"
                                  disabled={updateStatusLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(task.id, 'APPROVED');
                                    setShowCompletionButtons(null);
                                  }}
                                >
                                  <RotateCcw size={11} />
                                  Reset
                                </SecondaryActionButton>
                                <SecondaryActionButton
                                  variant="blocked"
                                  disabled={updateStatusLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(task.id, 'BLOCKED');
                                    setShowCompletionButtons(null);
                                  }}
                                >
                                  <Slash size={11} />
                                  I'm Blocked
                                </SecondaryActionButton>
                                <SecondaryActionButton
                                  variant="end"
                                  disabled={updateStatusLoading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCompletionButtons(task.id);
                                  }}
                                >
                                  <Check size={11} />
                                  End
                                </SecondaryActionButton>
                              </SecondaryActionsRow>
                            )}

                            {/* Completion Buttons (show when "End Task" is clicked) */}
                            {showCompletionButtons === task.id && (
                              <CompletionButtonsContainer>
                                <CompletionButtonsRow>
                                  <CompletionButton
                                    variant="completed"
                                    disabled={updateStatusLoading}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskToComplete({ task, type: 'COMPLETED' });
                                    }}
                                  >
                                    <Check size={14} />
                                    Completed
                                  </CompletionButton>
                                  <CompletionButton
                                    variant="partial"
                                    disabled={updateStatusLoading}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTaskToComplete({ task, type: 'PARTIALLY_COMPLETED' });
                                    }}
                                  >
                                    <AlertTriangle size={14} />
                                    Partial
                                  </CompletionButton>
                                </CompletionButtonsRow>
                                <CancelButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCompletionButtons(null);
                                  }}
                                >
                                  <ArrowLeft size={12} />
                                  Go Back
                                </CancelButton>
                              </CompletionButtonsContainer>
                            )}

                            {/* If task is BLOCKED, show option to resume */}
                            {task.status === 'BLOCKED' && (
                              <PrimaryActionButton
                                // isActive={false}
                                disabled={updateStatusLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(task.id, 'IN_PROGRESS');
                                  setShowCompletionButtons(null);
                                }}
                              >
                                <Play size={14} />
                                Resume Task
                              </PrimaryActionButton>
                            )}
                          </StatusButtonsContainer>
                        </div>
                      </TaskFooter>
                    </TaskCard>
                  ))}
                  </TasksGrid>
                )}
              </>
            )}

            {/* Task Pool Section - Only shown when Task Pool tab is active */}
            {activeTab === 'available' && (
              <>
                {/* Unassigned Tasks in Task Pool */}
                {taskPoolTasks.length > 0 && (
                  <>
                    <SectionHeader>
                      <SectionTitle>
                        <CheckSquare size={20} />
                        Task Pool
                        <SectionCount>({taskPoolTasks.length})</SectionCount>
                      </SectionTitle>
                    </SectionHeader>
                    <TasksGrid>
                      {taskPoolTasks.map((task) => (
                    <TaskCard key={task.id} priority={task.priority}>
                      <TaskHeader>
                        <TaskTitle>{task.title}</TaskTitle>
                        <Badge variant={task.status}>{task.status.replace(/_/g, ' ')}</Badge>
                      </TaskHeader>

                      <TaskDescription>{task.description}</TaskDescription>

                          <TaskMeta>
                        <Badge variant={task.priority}>
                          <AlertCircle size={10} />
                          {task.priority}
                        </Badge>
                        <CategoryBadge>
                          {formatCategory(task.category)}
                        </CategoryBadge>
                        <Badge>
                          <Clock size={10} />
                          {task.estimatedHours}h
                        </Badge>
                      </TaskMeta>

                      <TaskFooter>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {task.assignedTo ? (
                                <AssignedUserContainer>
                                  <UserAvatar>{getInitials(task.assignedTo.name)}</UserAvatar>
                                  <UserName>
                                    <ClickableUserName onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProfileUserId(task.assignedTo!.id);
                                    }}>
                                      {task.assignedTo.name}
                                    </ClickableUserName>
                                  </UserName>
                                </AssignedUserContainer>
                              ) : canSelfApprove(task) ? (
                                <AssignButton onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelfApprove(task.id);
                                }} disabled={selfApproveLoading}>
                                  <CheckCircle size={14} />
                                  Approve & Assign
                                </AssignButton>
                              ) : canSelfAssign(task) ? (
                                <AssignButton onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelfAssign(task);
                                }}>
                                  <UserPlus size={14} />
                                  Assign to Myself
                                </AssignButton>
                              ) : (
                                <UnassignedLabel>
                                  <User size={10} />
                                  Unassigned
                                </UnassignedLabel>
                              )}
                              {task.project && (
                                <TaskInfo>
                                  <Briefcase size={10} />
                                  {task.project.name}
                                </TaskInfo>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                              {task.dueDate && (
                                <TaskInfo>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                              {task.startedDate && task.status === 'IN_PROGRESS' && (
                                <TaskInfo style={{ color: 'inherit', opacity: 0.7 }}>
                                  <Clock size={10} />
                                  Started {new Date(task.startedDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                            </div>
                          </TaskFooter>
                        </TaskCard>
                      ))}
                    </TasksGrid>
                  </>
                )}

                {/* Tasks Assigned to Others - shown within Task Pool tab */}
                {tasksAssignedToOthers.length > 0 && (
                  <>
                    <SectionHeader>
                      <SectionTitle>
                        <User size={20} />
                        Active Tasks (Assigned to Others)
                        <SectionCount>({tasksAssignedToOthers.length})</SectionCount>
                      </SectionTitle>
                      <ViewToggle>
                        <ViewToggleButton
                          isActive={activeTasksView === 'task'}
                          onClick={() => setActiveTasksView('task')}
                        >
                          Task View
                        </ViewToggleButton>
                        <ViewToggleButton
                          isActive={activeTasksView === 'team'}
                          onClick={() => setActiveTasksView('team')}
                        >
                          Team View
                        </ViewToggleButton>
                      </ViewToggle>
                    </SectionHeader>

                    {activeTasksView === 'task' ? (
                      <TasksGrid>
                        {tasksAssignedToOthers.map((task) => (
                        <TaskCard key={task.id} priority={task.priority}>
                          <TaskHeader>
                            <TaskTitle>{task.title}</TaskTitle>
                            <Badge variant={task.status}>{task.status.replace(/_/g, ' ')}</Badge>
                          </TaskHeader>

                          <TaskDescription>{task.description}</TaskDescription>

                          <TaskMeta>
                            <Badge variant={task.priority}>
                              <AlertCircle size={10} />
                              {task.priority}
                            </Badge>
                            <CategoryBadge>
                              {formatCategory(task.category)}
                            </CategoryBadge>
                            <Badge>
                              <Clock size={10} />
                              {task.estimatedHours}h
                            </Badge>
                          </TaskMeta>

                          <TaskFooter>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <AssignedUserContainer>
                                <UserAvatar>{getInitials(task.assignedTo.name)}</UserAvatar>
                                <UserName>
                                  <ClickableUserName onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProfileUserId(task.assignedTo!.id);
                                  }}>
                                    {task.assignedTo.name}
                                  </ClickableUserName>
                                </UserName>
                              </AssignedUserContainer>
                              {task.project && (
                                <TaskInfo>
                                  <Briefcase size={10} />
                                  {task.project.name}
                                </TaskInfo>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                              {task.dueDate && (
                                <TaskInfo>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                              {task.startedDate && task.status === 'IN_PROGRESS' && (
                                <TaskInfo style={{ color: 'inherit', opacity: 0.7 }}>
                                  <Clock size={10} />
                                  Started {new Date(task.startedDate).toLocaleDateString()}
                                </TaskInfo>
                              )}
                            </div>
                          </TaskFooter>
                        </TaskCard>
                      ))}
                    </TasksGrid>
                    ) : (
                      <TeamViewContainer>
                        {tasksByUser.map(({ user, tasks }) => (
                          <UserCard key={user.id}>
                            <UserInfoHeader>
                              <UserAvatarCompact>
                                {getInitials(user.name)}
                              </UserAvatarCompact>
                              <UserInfo>
                                <UserNameLabel>
                                  <ClickableUserName onClick={() => setSelectedProfileUserId(user.id)}>
                                    {user.name}
                                  </ClickableUserName>
                                </UserNameLabel>
                                <UserTaskCount>
                                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                                </UserTaskCount>
                              </UserInfo>
                            </UserInfoHeader>
                            <TaskChipsContainer>
                              {tasks.map(task => (
                                <TaskChip
                                  key={task.id}
                                  priority={task.priority}
                                  status={task.status}
                                >
                                  <TaskChipTitle title={task.title}>
                                    {task.title}
                                  </TaskChipTitle>
                                  <TaskChipMeta>
                                    <TaskChipStatus status={task.status}>
                                      {task.status.replace(/_/g, ' ')}
                                    </TaskChipStatus>
                                    <span>•</span>
                                    <span>
                                      <Clock size={10} style={{ display: 'inline', marginRight: '2px' }} />
                                      {task.estimatedHours}h
                                    </span>
                                    {task.project && (
                                      <>
                                        <span>•</span>
                                        <span>{task.project.name}</span>
                                      </>
                                    )}
                                  </TaskChipMeta>
                                </TaskChip>
                              ))}
                            </TaskChipsContainer>
                          </UserCard>
                        ))}
                      </TeamViewContainer>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <PaginationContainer>
            <PaginationButton
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </PaginationButton>

            <PageNumbers>
              {getPageNumbers().map((pageNum, index) =>
                pageNum === -1 ? (
                  <PageInfo key={`ellipsis-${index}`}>...</PageInfo>
                ) : (
                  <PageNumber
                    key={pageNum}
                    isActive={pageNum === page}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PageNumber>
                )
              )}
            </PageNumbers>

            <PaginationButton
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </PaginationButton>
          </PaginationContainer>
        )}
      </MainContent>

      {showSuggestModal && (
        <SuggestTaskModal onClose={() => setShowSuggestModal(false)} />
      )}

      {taskToAssign && (
        <SelfAssignConfirmModal
          task={taskToAssign}
          onConfirm={confirmSelfAssign}
          onCancel={() => setTaskToAssign(null)}
          loading={assignLoading}
        />
      )}

      {taskToComplete && (
        <TaskCompletionConfirmModal
          task={taskToComplete.task}
          completionType={taskToComplete.type}
          onConfirm={confirmTaskCompletion}
          onCancel={() => setTaskToComplete(null)}
          loading={updateStatusLoading}
        />
      )}

      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </Container>
  );
};

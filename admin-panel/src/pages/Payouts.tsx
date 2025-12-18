import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { FiArrowLeft, FiCalendar, FiUser, FiTrendingUp, FiShield, FiCheckCircle, FiRefreshCw, FiDatabase } from 'react-icons/fi';

const TEAM_USERS_QUERY = gql`
  query GetTeamUsers($startDate: String, $endDate: String, $forceCalculate: Boolean) {
    getTeamUsers(startDate: $startDate, endDate: $endDate, forceCalculate: $forceCalculate) {
      id
      name
      email
      avatarUrl
      compensationINR
      availabilityScore
      stabilityScore
      monthlyOutputScore
      workingDaysInCycle
    }
  }
`;

const SYNC_PAYOUT_SNAPSHOTS = gql`
  mutation SyncPayoutSnapshots($startDate: String!, $endDate: String!) {
    syncPayoutSnapshots(startDate: $startDate, endDate: $endDate)
  }
`;

const GET_PAYOUT_SNAPSHOTS = gql`
  query GetPayoutSnapshots($startDate: String!, $endDate: String!) {
    getPayoutSnapshots(startDate: $startDate, endDate: $endDate) {
      id
      userId
      billingCycleStart
      billingCycleEnd
      monthlyOutputScore
      availabilityScore
      stabilityScore
      baseCompensationINR
      expectedPayoutINR
      differenceINR
      workingDaysInCycle
      snapshotDate
      user {
        id
        name
        email
        avatarUrl
      }
      syncedBy {
        id
        name
        email
      }
    }
  }
`;

interface TeamUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  compensationINR: number;
  availabilityScore: number;
  stabilityScore: number;
  monthlyOutputScore: number;
  workingDaysInCycle: number;
}

interface TeamUsersData {
  getTeamUsers: TeamUser[];
}

// Helper to calculate billing cycle (19th to 18th)
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
  for (let i = 0; i < 24; i++) { // Max 24 cycles to be safe
    let cycleMonth = currentCycleMonth - i;
    let cycleYear = currentCycleYear;

    while (cycleMonth < 0) {
      cycleMonth += 12;
      cycleYear -= 1;
    }

    // Stop if we've gone before November 2025
    if (cycleYear < PAYOUT_START_YEAR ||
        (cycleYear === PAYOUT_START_YEAR && cycleMonth < PAYOUT_START_MONTH)) {
      break;
    }

    // Start date: 19th at 00:00:00
    const startDate = new Date(cycleYear, cycleMonth, 19, 0, 0, 0, 0);
    // End date: 18th at 23:59:59.999 (to include the full day)
    const endDate = new Date(cycleYear, cycleMonth + 1, 18, 23, 59, 59, 999);

    const label = `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (${startDate.getDate()}th - ${endDate.getDate()}th)`;

    cycles.push({
      label,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  return cycles;
};

export default function Payouts() {
  const navigate = useNavigate();
  const billingCycles = useMemo(() => getBillingCycles(), []);

  const [selectedCycle, setSelectedCycle] = useState(0); // Index of current cycle
  const [activeTab, setActiveTab] = useState<'live' | 'snapshots'>('live');
  const cycle = billingCycles[selectedCycle];

  const { data, loading } = useQuery<TeamUsersData>(TEAM_USERS_QUERY, {
    variables: {
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      forceCalculate: true, // Always force calculation for admin panel Live Data
    },
    skip: activeTab === 'snapshots',
  });

  const { data: snapshotsData, loading: snapshotsLoading, refetch: refetchSnapshots } = useQuery(GET_PAYOUT_SNAPSHOTS, {
    variables: {
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    },
    skip: activeTab === 'live',
  });

  const [syncSnapshots, { loading: syncing }] = useMutation(SYNC_PAYOUT_SNAPSHOTS);

  const teamUsers = (data?.getTeamUsers || []).filter(
    (user) => user.email !== 'hello@saibbyweb.com'
  );

  const snapshotUsers = snapshotsData?.getPayoutSnapshots || [];

  const handleSyncSnapshots = async () => {
    try {
      await syncSnapshots({
        variables: {
          startDate: cycle.startDate,
          endDate: cycle.endDate,
        },
      });
      alert('Snapshots synced successfully!');
      if (activeTab === 'snapshots') {
        refetchSnapshots();
      }
    } catch (error) {
      console.error('Error syncing snapshots:', error);
      alert('Failed to sync snapshots');
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalBaseCompensation = 0;
    let totalAdditional = 0;
    let totalDeductions = 0;
    let totalExpectedPayout = 0;

    const users = activeTab === 'live' ? teamUsers : snapshotUsers;

    users.forEach((user: any) => {
      const compensation = activeTab === 'live' ? (user.compensationINR || 0) : user.baseCompensationINR;
      const expectedPayout = activeTab === 'live'
        ? compensation * (user.monthlyOutputScore / 100) * (user.availabilityScore / 100) * (user.stabilityScore / 100)
        : user.expectedPayoutINR;
      const difference = expectedPayout - compensation;

      totalBaseCompensation += compensation;
      totalExpectedPayout += expectedPayout;

      if (difference > 0) {
        totalAdditional += difference;
      } else if (difference < 0) {
        totalDeductions += Math.abs(difference);
      }
    });

    return {
      totalBaseCompensation,
      totalExpectedPayout,
      totalAdditional,
      totalDeductions,
    };
  }, [teamUsers, snapshotUsers, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Payouts</h1>
            <p className="text-gray-600 mt-1">Performance metrics and compensation overview</p>
          </div>
        </div>

        {/* Billing Cycle Selector & Controls */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiCalendar className="w-5 h-5 text-violet-600" />
              <label className="text-sm font-semibold text-gray-700">Billing Cycle</label>
            </div>
            <button
              onClick={handleSyncSnapshots}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-violet-500/30"
            >
              <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Snapshots'}
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(parseInt(e.target.value))}
              className="flex-1 md:flex-none md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
            >
              {billingCycles.map((cycle, index) => (
                <option key={index} value={index}>
                  {cycle.label}
                </option>
              ))}
            </select>

            {/* Tab Selector */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'live'
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live Data
              </button>
              <button
                onClick={() => setActiveTab('snapshots')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'snapshots'
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FiDatabase className="w-4 h-4" />
                Snapshots
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40">
              <div className="text-sm font-medium text-gray-600 mb-2">Total Base Compensation</div>
              <div className="text-2xl font-black text-gray-900">
                ₹{summaryStats.totalBaseCompensation.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-2">Total Expected Payout</div>
              <div className="text-2xl font-black text-blue-900 mb-1">
                ₹{Math.round(summaryStats.totalExpectedPayout).toLocaleString('en-IN')}
              </div>
              <div className={`text-sm font-bold ${(summaryStats.totalExpectedPayout - summaryStats.totalBaseCompensation) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(summaryStats.totalExpectedPayout - summaryStats.totalBaseCompensation) >= 0 ? '+' : ''}₹{Math.round(summaryStats.totalExpectedPayout - summaryStats.totalBaseCompensation).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-2">Total Additional</div>
              <div className="text-2xl font-black text-green-900">
                +₹{Math.round(summaryStats.totalAdditional).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
              <div className="text-sm font-medium text-red-700 mb-2">Total Deductions</div>
              <div className="text-2xl font-black text-red-900">
                -₹{Math.round(summaryStats.totalDeductions).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Cards */}
      <div className="max-w-7xl mx-auto">
        {(loading || snapshotsLoading) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-gray-200 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 rounded w-40 mx-auto mb-6" />
                <div className="space-y-3">
                  <div className="h-16 bg-gray-200 rounded-xl" />
                  <div className="h-16 bg-gray-200 rounded-xl" />
                  <div className="h-16 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === 'live' ? teamUsers : snapshotUsers).map((item: any) => {
              // Handle both live data and snapshots
              const user = activeTab === 'live' ? item : item.user;
              const compensation = activeTab === 'live' ? (item.compensationINR || 0) : item.baseCompensationINR;
              const monthlyOutputScore = activeTab === 'live' ? item.monthlyOutputScore : item.monthlyOutputScore;
              const availabilityScore = activeTab === 'live' ? item.availabilityScore : item.availabilityScore;
              const stabilityScore = activeTab === 'live' ? item.stabilityScore : item.stabilityScore;

              // Calculate expected payout
              const expectedPayout = activeTab === 'live'
                ? compensation * (monthlyOutputScore / 100) * (availabilityScore / 100) * (stabilityScore / 100)
                : item.expectedPayoutINR;
              const difference = expectedPayout - compensation;

              return (
                <div
                  key={user.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-200 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-100/30 to-transparent rounded-full blur-2xl" />

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Score Cards */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {/* Monthly Output Score */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-2 border border-blue-100">
                      <div className="flex items-center gap-1 mb-1">
                        <FiTrendingUp className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Output</span>
                      </div>
                      <div className="text-xl font-black text-blue-900">
                        {monthlyOutputScore.toFixed(1)}
                        <span className="text-xs text-blue-600 font-normal ml-0.5">%</span>
                      </div>
                    </div>

                    {/* Availability Score */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
                      <div className="flex items-center gap-1 mb-1">
                        <FiCheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Avail.</span>
                      </div>
                      <div className="text-xl font-black text-green-900">
                        {availabilityScore.toFixed(1)}
                        <span className="text-xs text-green-600 font-normal ml-0.5">%</span>
                      </div>
                    </div>

                    {/* Stability Score */}
                    <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg p-2 border border-purple-100">
                      <div className="flex items-center gap-1 mb-1">
                        <FiShield className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">Stability</span>
                      </div>
                      <div className="text-xl font-black text-purple-900">
                        {stabilityScore.toFixed(1)}
                        <span className="text-xs text-purple-600 font-normal ml-0.5">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Expected Payout Section */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-200">
                    <div className="text-xs font-medium text-amber-700 mb-2 uppercase tracking-wide">
                      Expected Payout
                    </div>

                    {/* Calculation Formula */}
                    <div className="text-xs text-gray-600 mb-2 font-mono">
                      ₹{compensation.toLocaleString('en-IN')} × {
                        (monthlyOutputScore / 100).toFixed(3).replace(/\.?0+$/, '')
                      } × {
                        (availabilityScore / 100).toFixed(3).replace(/\.?0+$/, '')
                      } × {
                        (stabilityScore / 100).toFixed(3).replace(/\.?0+$/, '')
                      }
                    </div>

                    {/* Expected Payout Amount */}
                    <div className="text-2xl font-black text-amber-900 mb-1">
                      ₹{expectedPayout.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </div>

                    {/* Difference */}
                    <div className={`text-sm font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {difference >= 0 ? '+' : ''}₹{difference.toFixed(2).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && teamUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FiUser className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
}

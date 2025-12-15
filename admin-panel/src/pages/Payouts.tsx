import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { FiArrowLeft, FiCalendar, FiUser, FiTrendingUp, FiShield, FiCheckCircle } from 'react-icons/fi';

const TEAM_USERS_QUERY = gql`
  query GetTeamUsers($startDate: String, $endDate: String) {
    getTeamUsers(startDate: $startDate, endDate: $endDate) {
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

    const startDate = new Date(cycleYear, cycleMonth, 19);
    const endDate = new Date(cycleYear, cycleMonth + 1, 18);

    const label = `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (${startDate.getDate()}th - ${endDate.getDate()}th)`;

    cycles.push({
      label,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }

  return cycles;
};

export default function Payouts() {
  const navigate = useNavigate();
  const billingCycles = useMemo(() => getBillingCycles(), []);

  const [selectedCycle, setSelectedCycle] = useState(0); // Index of current cycle
  const cycle = billingCycles[selectedCycle];

  const { data, loading } = useQuery<TeamUsersData>(TEAM_USERS_QUERY, {
    variables: {
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    },
  });

  const teamUsers = (data?.getTeamUsers || []).filter(
    (user) => user.email !== 'hello@saibbyweb.com'
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalBaseCompensation = 0;
    let totalAdditional = 0;
    let totalDeductions = 0;
    let totalExpectedPayout = 0;

    teamUsers.forEach((user) => {
      const compensation = user.compensationINR || 0;
      const outputMultiplier = user.monthlyOutputScore / 100;
      const availabilityMultiplier = user.availabilityScore / 100;
      const stabilityMultiplier = user.stabilityScore / 100;
      const expectedPayout = compensation * outputMultiplier * availabilityMultiplier * stabilityMultiplier;
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
  }, [teamUsers]);

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

        {/* Billing Cycle Selector */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <FiCalendar className="w-5 h-5 text-violet-600" />
            <label className="text-sm font-semibold text-gray-700">Billing Cycle</label>
          </div>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(parseInt(e.target.value))}
            className="w-full md:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
          >
            {billingCycles.map((cycle, index) => (
              <option key={index} value={index}>
                {cycle.label}
              </option>
            ))}
          </select>
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
        {loading ? (
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
            {teamUsers.map((user) => {
              // Use compensation or 0 if not set
              const compensation = user.compensationINR || 0;

              // Calculate multipliers
              const outputMultiplier = user.monthlyOutputScore / 100; // Convert percentage to multiplier
              const availabilityMultiplier = user.availabilityScore / 100; // Convert percentage to multiplier
              const stabilityMultiplier = user.stabilityScore / 100; // Convert percentage to multiplier

              // Calculate expected payout
              const expectedPayout = compensation * outputMultiplier * availabilityMultiplier * stabilityMultiplier;
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
                        {user.monthlyOutputScore.toFixed(1)}
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
                        {user.availabilityScore.toFixed(1)}
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
                        {user.stabilityScore.toFixed(1)}
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
                        outputMultiplier.toFixed(3).replace(/\.?0+$/, '')
                      } × {
                        availabilityMultiplier.toFixed(3).replace(/\.?0+$/, '')
                      } × {
                        stabilityMultiplier.toFixed(3).replace(/\.?0+$/, '')
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

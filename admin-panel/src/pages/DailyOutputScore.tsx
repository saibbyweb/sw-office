import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiCalendar, FiAward, FiTrendingUp, FiCheckCircle, FiUser, FiStar } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import {
  CREATE_OR_UPDATE_DAILY_SCORE_MUTATION,
  DAILY_SCORES_BY_DATE_QUERY,
  TASKS_COMPLETED_ON_DATE_QUERY,
  ALL_DAILY_SCORES_QUERY,
} from '../graphql/daily-output-score.mutations';

interface DailyOutputScoreProps {
  backPath?: string;
  title?: string;
}

export default function DailyOutputScore({
  backPath = '/',
  title = 'Daily Output Score'
}: DailyOutputScoreProps = {}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Score form state
  const [scoreData, setScoreData] = useState({
    score: 5,
    tasksCompleted: 0,
    taskDifficulty: 5,
    initiativeCount: 0,
    qualityRating: 5,
    availabilityRating: 5,
    notes: '',
  });

  const { data: usersData } = useQuery(ADMIN_USERS_QUERY);
  const { data: scoresData, refetch: refetchScores } = useQuery(DAILY_SCORES_BY_DATE_QUERY, {
    variables: { date: selectedDate },
  });
  const { data: tasksData } = useQuery(TASKS_COMPLETED_ON_DATE_QUERY, {
    variables: {
      date: selectedDate,
      userId: selectedUser?.value || undefined,
    },
  });
  const { data: allScoresData } = useQuery(ALL_DAILY_SCORES_QUERY, {
    variables: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
    },
  });

  const [createOrUpdateScore] = useMutation(CREATE_OR_UPDATE_DAILY_SCORE_MUTATION, {
    onCompleted: () => {
      toast.success('Daily score saved successfully');
      setShowScoreModal(false);
      resetForm();
      refetchScores();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setScoreData({
      score: 5,
      tasksCompleted: 0,
      taskDifficulty: 5,
      initiativeCount: 0,
      qualityRating: 5,
      availabilityRating: 5,
      notes: '',
    });
    setSelectedUser(null);
  };

  const handleOpenScoreModal = (user: any) => {
    setSelectedUser(user);

    // Check if score already exists for this user and date
    const existingScore = scoresData?.dailyScoresByDate?.find(
      (s: any) => s.userId === user.value
    );

    if (existingScore) {
      setScoreData({
        score: existingScore.score,
        tasksCompleted: existingScore.tasksCompleted || 0,
        taskDifficulty: existingScore.taskDifficulty || 5,
        initiativeCount: existingScore.initiativeCount || 0,
        qualityRating: existingScore.qualityRating || 5,
        availabilityRating: existingScore.availabilityRating || 5,
        notes: existingScore.notes || '',
      });
    } else {
      // Auto-calculate from task completions
      const userCompletions = tasksData?.tasksCompletedOnDate?.filter(
        (tc: any) => tc.assignedToId === user.value
      ) || [];

      const tasksCompleted = userCompletions.length;
      const initiativeCount = userCompletions.filter(
        (tc: any) => tc.suggestedById === user.value
      ).length;

      const avgDifficulty = userCompletions.length > 0
        ? userCompletions.reduce((sum: number, tc: any) => sum + (tc.difficulty || 5), 0) / userCompletions.length
        : 5;

      setScoreData({
        score: 5,
        tasksCompleted,
        taskDifficulty: Math.round(avgDifficulty * 10) / 10,
        initiativeCount,
        qualityRating: 5,
        availabilityRating: 5,
        notes: '',
      });
    }

    setShowScoreModal(true);
  };

  const handleSubmitScore = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (scoreData.score < 0 || scoreData.score > 10) {
      toast.error('Score must be between 0 and 10');
      return;
    }

    createOrUpdateScore({
      variables: {
        input: {
          userId: selectedUser.value,
          date: selectedDate,
          score: scoreData.score,
          tasksCompleted: scoreData.tasksCompleted,
          taskDifficulty: scoreData.taskDifficulty,
          initiativeCount: scoreData.initiativeCount,
          qualityRating: scoreData.qualityRating,
          availabilityRating: scoreData.availabilityRating,
          notes: scoreData.notes,
        },
      },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50';
    if (score >= 6) return 'bg-blue-50';
    if (score >= 4) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const userOptions = usersData?.adminUsers?.map((user: any) => ({
    value: user.id,
    label: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  })) || [];

  const usersWithScores = userOptions.map((user: any) => {
    const score = scoresData?.dailyScoresByDate?.find((s: any) => s.userId === user.value);
    return { ...user, score };
  });

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text">
              {title}
            </h1>
            <p className="text-gray-600 mt-1">Track daily performance and output quality</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
            <FiCalendar className="w-4 h-4 text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-gray-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <FiUser className="w-8 h-8 text-violet-600" />
            <span className="text-2xl font-bold text-gray-800">
              {scoresData?.dailyScoresByDate?.length || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Scored Today</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <FiTrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">
              {scoresData?.dailyScoresByDate?.length > 0
                ? (scoresData.dailyScoresByDate.reduce((sum: number, s: any) => sum + s.score, 0) / scoresData.dailyScoresByDate.length).toFixed(1)
                : '0.0'}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Avg Score</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">
              {tasksData?.tasksCompletedOnDate?.length || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Tasks Completed</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <FiStar className="w-8 h-8 text-amber-600" />
            <span className="text-2xl font-bold text-gray-800">
              {scoresData?.dailyScoresByDate?.filter((s: any) => s.score >= 8).length || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Top Performers</p>
        </div>
      </div>

      {/* Users List with Scores */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiAward className="w-5 h-5 text-violet-600" />
          Team Performance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usersWithScores.map((user: any) => {
            const taskCompletions = tasksData?.tasksCompletedOnDate?.filter(
              (tc: any) => tc.assignedToId === user.value
            ) || [];

            return (
              <motion.div
                key={user.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                  user.score
                    ? `${getScoreBgColor(user.score.score)} border-transparent`
                    : 'bg-white/40 border-gray-200 hover:border-violet-300'
                }`}
                onClick={() => handleOpenScoreModal(user)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.label}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                        {user.label.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{user.label}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {user.score && (
                    <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getScoreColor(user.score.score)} text-white font-bold text-lg`}>
                      {user.score.score.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FiCheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700 font-medium">{taskCompletions.length} tasks</span>
                  </div>
                  {user.score && user.score.initiativeCount > 0 && (
                    <div className="flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-amber-600" />
                      <span className="text-gray-700 font-medium">{user.score.initiativeCount} initiative</span>
                    </div>
                  )}
                </div>

                {!user.score && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Click to assign score
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Score Assignment Modal */}
      <AnimatePresence>
        {showScoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowScoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Assign Daily Score - {selectedUser?.label}
              </h2>

              <div className="space-y-6">
                {/* Overall Score */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overall Performance Score (0-10) *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={scoreData.score}
                      onChange={(e) => setScoreData({ ...scoreData, score: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${getScoreColor(scoreData.score)} text-white font-bold text-2xl min-w-[80px] text-center`}>
                      {scoreData.score.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tasks Completed */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tasks Completed
                    </label>
                    <input
                      type="number"
                      value={scoreData.tasksCompleted}
                      onChange={(e) => setScoreData({ ...scoreData, tasksCompleted: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Initiative Count */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Self-Suggested Tasks
                    </label>
                    <input
                      type="number"
                      value={scoreData.initiativeCount}
                      onChange={(e) => setScoreData({ ...scoreData, initiativeCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Task Difficulty */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Average Task Difficulty (0-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={scoreData.taskDifficulty}
                      onChange={(e) => setScoreData({ ...scoreData, taskDifficulty: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium min-w-[60px] text-center">
                      {scoreData.taskDifficulty.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Quality Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quality Rating (0-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={scoreData.qualityRating}
                      onChange={(e) => setScoreData({ ...scoreData, qualityRating: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium min-w-[60px] text-center">
                      {scoreData.qualityRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Code quality, no bugs, clean delivery</p>
                </div>

                {/* Availability Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Availability Rating (0-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={scoreData.availabilityRating}
                      onChange={(e) => setScoreData({ ...scoreData, availabilityRating: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium min-w-[60px] text-center">
                      {scoreData.availabilityRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Being active, responsive, available</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes / Feedback
                  </label>
                  <textarea
                    value={scoreData.notes}
                    onChange={(e) => setScoreData({ ...scoreData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
                    placeholder="Optional feedback for the employee..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmitScore}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Save Score
                  </button>
                  <button
                    onClick={() => {
                      setShowScoreModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

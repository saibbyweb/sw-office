import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiCalendar, FiAward, FiTrendingUp, FiCheckCircle, FiUser, FiStar, FiX, FiUsers } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  USER_DAILY_SCORES_QUERY,
  COMPLETED_TASKS_BY_USER_QUERY,
  UPDATE_TASK_SCORE_MUTATION,
} from '../graphql/daily-output-score.mutations';

interface DailyOutputScoreProps {
  backPath?: string;
  title?: string;
}

interface UserDailyScore {
  userId: string;
  userName: string;
  totalTasks: number;
  scoredTasks: number;
  averageScore: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  points: number;
  score?: number;
  estimatedHours: number;
  actualHours?: number;
  completedDate?: string;
  project?: { id: string; name: string };
  assignedTo?: { id: string; name: string; email: string };
  suggestedBy?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string };
}

const categoryColors: Record<string, string> = {
  MOBILE_APP: 'from-blue-500 to-cyan-500',
  WEB_FRONTEND: 'from-purple-500 to-pink-500',
  BACKEND_API: 'from-green-500 to-emerald-500',
  FULL_STACK: 'from-indigo-500 to-violet-500',
  BUG_FIX: 'from-red-500 to-orange-500',
  DEBUGGING: 'from-yellow-500 to-amber-500',
  CODE_REVIEW: 'from-teal-500 to-cyan-500',
  TESTING_QA: 'from-lime-500 to-green-500',
  DEVOPS: 'from-slate-500 to-gray-500',
  DOCUMENTATION: 'from-sky-500 to-blue-500',
  CLIENT_COMMUNICATION: 'from-rose-500 to-pink-500',
  MENTORING: 'from-violet-500 to-purple-500',
  RESEARCH: 'from-amber-500 to-orange-500',
  OFFICE_TASKS: 'from-neutral-500 to-stone-500',
  MISCELLANEOUS: 'from-gray-500 to-slate-500',
};

export default function DailyOutputScore({
  backPath = '/',
  title = 'Daily Output Score'
}: DailyOutputScoreProps = {}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scoringModalUser, setScoringModalUser] = useState<UserDailyScore | null>(null);

  const getDateRange = () => {
    if (selectedDate) {
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      const startOfDay = new Date(start.setHours(0, 0, 0, 0));
      const endOfDay = new Date(end.setHours(23, 59, 59, 999));
      return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
    }
    return {};
  };

  const { data: userDailyScoresData, loading: scoresLoading } = useQuery(
    USER_DAILY_SCORES_QUERY,
    {
      variables: getDateRange(),
    }
  );

  const getScoreColor = (score: number) => {
    if (score >= 120) return 'from-green-500 to-emerald-600';
    if (score >= 100) return 'from-blue-500 to-cyan-600';
    if (score >= 80) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 120) return 'bg-green-50';
    if (score >= 100) return 'bg-blue-50';
    if (score >= 80) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const userScores = userDailyScoresData?.userDailyScores || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 p-8">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
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
              <p className="text-gray-600 mt-1">Score individual tasks to calculate daily performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl px-4 py-2 border border-white/40 shadow-sm">
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
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <FiUser className="w-8 h-8 text-violet-600" />
              <span className="text-2xl font-bold text-gray-800">
                {userScores.length}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Team Members</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-800">
                {userScores.reduce((sum: number, u: UserDailyScore) => sum + u.totalTasks, 0)}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Total Tasks</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <FiTrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">
                {userScores.length > 0
                  ? Math.round(userScores.reduce((sum: number, u: UserDailyScore) => sum + u.averageScore, 0) / userScores.length)
                  : 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Team Avg Score</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <FiStar className="w-8 h-8 text-amber-600" />
              <span className="text-2xl font-bold text-gray-800">
                {userScores.filter((u: UserDailyScore) => u.averageScore >= 120).length}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Top Performers</p>
          </div>
        </div>

        {/* Users List with Scores */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiAward className="w-5 h-5 text-violet-600" />
            Team Performance - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>

          {scoresLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading team performance...</div>
            </div>
          ) : userScores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FiUsers className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No team activity</p>
              <p className="text-gray-400 text-sm">
                No tasks were completed on this date
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Rating Section */}
              {userScores.filter((u: UserDailyScore) => u.scoredTasks < u.totalTasks).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-700">
                      Pending Rating ({userScores.filter((u: UserDailyScore) => u.scoredTasks < u.totalTasks).length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userScores
                      .filter((u: UserDailyScore) => u.scoredTasks < u.totalTasks)
                      .map((userScore: UserDailyScore, index: number) => (
                        <UserScoreCard
                          key={userScore.userId}
                          userScore={userScore}
                          index={index}
                          getScoreColor={getScoreColor}
                          getScoreBgColor={getScoreBgColor}
                          onClick={() => setScoringModalUser(userScore)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Fully Scored Section */}
              {userScores.filter((u: UserDailyScore) => u.scoredTasks === u.totalTasks).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-gray-700">
                      Fully Scored ({userScores.filter((u: UserDailyScore) => u.scoredTasks === u.totalTasks).length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userScores
                      .filter((u: UserDailyScore) => u.scoredTasks === u.totalTasks)
                      .map((userScore: UserDailyScore, index: number) => (
                        <UserScoreCard
                          key={userScore.userId}
                          userScore={userScore}
                          index={index}
                          getScoreColor={getScoreColor}
                          getScoreBgColor={getScoreBgColor}
                          onClick={() => setScoringModalUser(userScore)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Scoring Modal */}
      <AnimatePresence>
        {scoringModalUser && (
          <TaskScoringModal
            userScore={scoringModalUser}
            dateRange={getDateRange()}
            onClose={() => setScoringModalUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserScoreCard({
  userScore,
  index,
  getScoreColor,
  getScoreBgColor,
  onClick,
}: {
  userScore: UserDailyScore;
  index: number;
  getScoreColor: (score: number) => string;
  getScoreBgColor: (score: number) => string;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
        userScore.scoredTasks === userScore.totalTasks
          ? `${getScoreBgColor(userScore.averageScore)} border-transparent`
          : 'bg-white/60 border-gray-200 hover:border-violet-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
            {userScore.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{userScore.userName}</h3>
            <p className="text-xs text-gray-500">
              {userScore.scoredTasks} of {userScore.totalTasks} rated
            </p>
          </div>
        </div>

        {userScore.scoredTasks > 0 && (
          <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getScoreColor(userScore.averageScore)} text-white font-bold text-lg`}>
            {userScore.averageScore}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <FiCheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-700 font-medium">{userScore.totalTasks} tasks</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${
            userScore.scoredTasks === userScore.totalTasks
              ? 'text-green-600'
              : 'text-amber-600'
          }`}>
            {userScore.scoredTasks === userScore.totalTasks ? (
              <span className="flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                All Scored
              </span>
            ) : (
              `${userScore.totalTasks - userScore.scoredTasks} pending`
            )}
          </span>
          <span className="text-gray-400">Click to score →</span>
        </div>
      </div>
    </motion.div>
  );
}

function TaskScoringModal({
  userScore,
  dateRange,
  onClose
}: {
  userScore: UserDailyScore;
  dateRange: { startDate?: string; endDate?: string };
  onClose: () => void;
}) {
  const { data: tasksData, loading: tasksLoading } = useQuery(
    COMPLETED_TASKS_BY_USER_QUERY,
    {
      variables: {
        userId: userScore.userId,
        ...dateRange,
      },
    }
  );

  const [updateTaskScore] = useMutation(UPDATE_TASK_SCORE_MUTATION, {
    refetchQueries: [
      { query: COMPLETED_TASKS_BY_USER_QUERY, variables: { userId: userScore.userId, ...dateRange } },
      { query: USER_DAILY_SCORES_QUERY, variables: dateRange },
    ],
  });

  const [taskScores, setTaskScores] = useState<Record<string, number>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const handleScoreChange = (taskId: string, score: number) => {
    setTaskScores(prev => ({ ...prev, [taskId]: score }));
  };

  const handleSaveScore = async (taskId: string, score: number) => {
    setSavingTaskId(taskId);
    try {
      await updateTaskScore({
        variables: { taskId, score },
      });
      toast.success('Score saved!', { duration: 1000 });
    } catch (error: any) {
      console.error('Update score error:', error);
      toast.error('Failed to save score');
    } finally {
      setSavingTaskId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl">
                {userScore.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userScore.userName}</h2>
                <p className="text-white/90">Score tasks for quality and output</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-xs text-white/80">Tasks</p>
                <p className="text-lg font-bold">{userScore.totalTasks}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-xs text-white/80">Scored</p>
                <p className="text-lg font-bold">{userScore.scoredTasks}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-xs text-white/80">Average</p>
                <p className="text-lg font-bold">{userScore.averageScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {tasksLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">Loading tasks...</div>
            </div>
          ) : !tasksData?.completedTasksByUser || tasksData.completedTasksByUser.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FiCheckCircle className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No tasks to score</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasksData.completedTasksByUser.map((task: Task, index: number) => {
                const categoryGradient = categoryColors[task.category];
                const currentScore = taskScores[task.id] !== undefined ? taskScores[task.id] : (task.score ?? 100);
                const hasChanges = taskScores[task.id] !== undefined && taskScores[task.id] !== task.score;
                const isRated = task.score !== undefined && task.score !== null; // Task is rated if score exists in DB
                const isDefaultScore = currentScore === 100;

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg p-3 border-2 transition-all ${
                      isRated
                        ? 'bg-green-50 border-green-200 hover:border-green-300'
                        : 'bg-white border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    {/* Header with gradient indicator */}
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-16 bg-gradient-to-b ${categoryGradient} rounded-full flex-shrink-0`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 text-sm truncate">{task.title}</h3>
                              {isRated && (
                                <FiCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <FiAward className="w-3 h-3 text-amber-500" />
                                {task.points}
                              </span>
                              <span>•</span>
                              <span className="truncate">{task.category.replace(/_/g, ' ')}</span>
                              {task.project && (
                                <>
                                  <span>•</span>
                                  <span className="text-violet-600 truncate">{task.project.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Slider and Score in one row */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={currentScore}
                              onChange={(e) => handleScoreChange(task.id, parseInt(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                              <span>0</span>
                              <span>100</span>
                              <span>200</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xl font-bold w-12 text-center ${
                              currentScore >= 120 ? 'text-green-600' :
                              currentScore >= 100 ? 'text-blue-600' :
                              currentScore >= 80 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {currentScore}
                            </span>

                            <button
                              onClick={() => handleSaveScore(task.id, currentScore)}
                              disabled={savingTaskId === task.id}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all min-w-[80px] ${
                                savingTaskId === task.id
                                  ? 'bg-gray-300 text-gray-600 cursor-wait'
                                  : hasChanges || (!isRated && isDefaultScore)
                                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg'
                                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                              }`}
                            >
                              {savingTaskId === task.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                              ) : isRated && !hasChanges ? (
                                'Reassign'
                              ) : (
                                'Save'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

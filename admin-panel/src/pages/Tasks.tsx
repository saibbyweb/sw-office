import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiPlus, FiX, FiAlertCircle, FiCheckCircle, FiClock, FiTarget, FiZap, FiAward, FiUser, FiUserPlus, FiCheck, FiCornerUpLeft } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { PROJECTS_QUERY } from '../graphql/projects.queries';
import { CREATE_TASK_MUTATION, TASKS_QUERY, ASSIGN_TASK_MUTATION, APPROVE_TASK_MUTATION, UNAPPROVE_TASK_MUTATION } from '../graphql/tasks.mutations';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';

interface Project {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface ProjectsData {
  projects: Project[];
}

// Temporary mock data - will be replaced with GraphQL
const mockTasks = [
  {
    id: '1',
    title: 'Implement user authentication flow',
    description: 'Add JWT-based authentication with refresh tokens',
    category: 'BACKEND_API',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    points: 13,
    estimatedHours: 8,
    actualHours: 5.5,
    project: { name: 'Auth Service' },
  },
  {
    id: '2',
    title: 'Fix mobile responsive issues on dashboard',
    description: 'Dashboard breaks on screens below 768px width',
    category: 'BUG_FIX',
    priority: 'CRITICAL',
    status: 'SUGGESTED',
    points: 5,
    estimatedHours: 3,
    project: { name: 'Admin Panel' },
  },
];

const categoryColors = {
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

const priorityConfig = {
  LOW: { color: 'text-blue-600', bg: 'bg-blue-100', icon: FiClock },
  MEDIUM: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: FiTarget },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-100', icon: FiZap },
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-100', icon: FiAlertCircle },
};

const statusConfig = {
  SUGGESTED: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Suggested' },
  APPROVED: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Approved' },
  IN_PROGRESS: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'In Progress' },
  COMPLETED: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  REJECTED: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
  BLOCKED: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Blocked' },
};

interface User {
  id: string;
  name: string;
  email: string;
}

interface UsersData {
  adminUsers: User[];
}

interface TasksData {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    points: number;
    estimatedHours: number;
    actualHours?: number;
    project?: { id: string; name: string; };
    assignedTo?: User;
  }>;
}

export default function Tasks() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assignModalTask, setAssignModalTask] = useState<string | null>(null);
  const { data: tasksData, loading: tasksLoading, refetch } = useQuery<TasksData>(TASKS_QUERY);
  const { data: usersData, loading: usersLoading } = useQuery<UsersData>(ADMIN_USERS_QUERY);
  const [assignTask] = useMutation(ASSIGN_TASK_MUTATION);
  const [approveTask] = useMutation(APPROVE_TASK_MUTATION, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });
  const [unapproveTask] = useMutation(UNAPPROVE_TASK_MUTATION, {
    refetchQueries: [{ query: TASKS_QUERY }],
  });

  const handleCreateTask = () => {
    setShowCreateForm(true);
  };

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      await assignTask({
        variables: { taskId, userId },
      });
      toast.success('Task assigned successfully!');
      setAssignModalTask(null);
      refetch();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const handleApproveTask = async (taskId: string) => {
    if (usersLoading) {
      toast.error('Loading users, please wait...');
      return;
    }

    try {
      // Use first admin user as approver (TODO: Get from auth context)
      const approvedById = usersData?.adminUsers[0]?.id;
      if (!approvedById) {
        toast.error('No admin user found');
        console.error('Users data:', usersData);
        return;
      }

      console.log('Approving task:', taskId, 'by:', approvedById);

      const result = await approveTask({
        variables: { taskId, approvedById },
      });

      console.log('Approve result:', result);
      toast.success('Task approved successfully!');
    } catch (error: any) {
      console.error('Approve task error:', error);
      const errorMessage = error?.message || error?.graphQLErrors?.[0]?.message || 'Failed to approve task';
      toast.error(errorMessage);
    }
  };

  const handleUnapproveTask = async (taskId: string) => {
    try {
      await unapproveTask({
        variables: { taskId },
      });
      toast.success('Task moved back to suggested!');
    } catch (error: any) {
      console.error('Unapprove task error:', error);
      const errorMessage = error?.message || error?.graphQLErrors?.[0]?.message || 'Failed to move task';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                title="Back to Home"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text">
                  Task Manager
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage tasks, track progress, and celebrate wins
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTask}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              <span className="font-medium">Create Task</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {tasksLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading tasks...</div>
          </div>
        ) : tasksData?.tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FiCheckCircle className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No tasks yet</p>
            <p className="text-gray-400 text-sm">Create your first task to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggested Tasks Column */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Suggested Tasks</h2>
                  <p className="text-sm text-gray-500">
                    {tasksData?.tasks.filter(t => t.status === 'SUGGESTED').length} tasks
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {tasksData?.tasks.filter(t => t.status === 'SUGGESTED').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center bg-white/60 backdrop-blur-md rounded-2xl border-2 border-dashed border-gray-300">
                    <FiCheckCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">No suggested tasks</p>
                  </div>
                ) : (
                  tasksData?.tasks.filter(t => t.status === 'SUGGESTED').map((task, index) => {
                    const PriorityIcon = priorityConfig[task.priority as keyof typeof priorityConfig].icon;
                    const categoryGradient = categoryColors[task.category as keyof typeof categoryColors];

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        PriorityIcon={PriorityIcon}
                        categoryGradient={categoryGradient}
                        onAssign={setAssignModalTask}
                        onApprove={handleApproveTask}
                        onUnapprove={handleUnapproveTask}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Tasks Column */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-600 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Active Tasks</h2>
                  <p className="text-sm text-gray-500">
                    {tasksData?.tasks.filter(t => t.status !== 'SUGGESTED' && t.status !== 'REJECTED').length} tasks
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {tasksData?.tasks.filter(t => t.status !== 'SUGGESTED' && t.status !== 'REJECTED').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center bg-white/60 backdrop-blur-md rounded-2xl border-2 border-dashed border-gray-300">
                    <FiCheckCircle className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">No active tasks</p>
                  </div>
                ) : (
                  tasksData?.tasks.filter(t => t.status !== 'SUGGESTED' && t.status !== 'REJECTED').map((task, index) => {
                    const PriorityIcon = priorityConfig[task.priority as keyof typeof priorityConfig].icon;
                    const categoryGradient = categoryColors[task.category as keyof typeof categoryColors];

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        PriorityIcon={PriorityIcon}
                        categoryGradient={categoryGradient}
                        onAssign={setAssignModalTask}
                        onApprove={handleApproveTask}
                        onUnapprove={handleUnapproveTask}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateTaskModal onClose={() => setShowCreateForm(false)} onSuccess={refetch} />
        )}
      </AnimatePresence>

      {/* Assign Task Modal */}
      <AnimatePresence>
        {assignModalTask && (
          <AssignTaskModal
            task={tasksData?.tasks.find(t => t.id === assignModalTask)!}
            users={usersData?.adminUsers.filter(u => !u.archived) || []}
            onClose={() => setAssignModalTask(null)}
            onAssign={(userId) => handleAssignTask(assignModalTask, userId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({
  task,
  index,
  PriorityIcon,
  categoryGradient,
  onAssign,
  onApprove,
  onUnapprove,
}: {
  task: TasksData['tasks'][0];
  index: number;
  PriorityIcon: any;
  categoryGradient: string;
  onAssign: (taskId: string) => void;
  onApprove: (taskId: string) => Promise<void>;
  onUnapprove: (taskId: string) => Promise<void>;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isUnapproving, setIsUnapproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(task.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleUnapprove = async () => {
    setIsUnapproving(true);
    try {
      await onUnapprove(task.id);
    } finally {
      setIsUnapproving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/80 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-white/40 overflow-hidden group"
    >
      {/* Card Header with Gradient */}
      <div className={`h-1 bg-gradient-to-r ${categoryGradient}`} />

      <div className="p-4">
        {/* Title, Status and Metadata */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 group-hover:text-violet-600 transition-colors truncate">
              {task.title}
            </h3>
            <p className="text-gray-500 text-xs mt-1 line-clamp-1">
              {task.description}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityConfig[task.priority as keyof typeof priorityConfig].bg}`}>
              <PriorityIcon className={`w-3 h-3 ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`} />
            </div>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusConfig[task.status as keyof typeof statusConfig].bg} ${statusConfig[task.status as keyof typeof statusConfig].color}`}>
              {statusConfig[task.status as keyof typeof statusConfig].label}
            </span>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <FiAward className="w-3 h-3 text-amber-500" />
              <span className="font-bold text-amber-600">{task.points}</span>
              <span className="text-gray-400">pts</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-500">
              {task.category.replace(/_/g, ' ')}
            </div>
            {task.project && (
              <>
                <div className="text-gray-400">•</div>
                <div className="text-violet-600 font-medium">
                  {task.project.name}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar (if in progress) */}
        {task.actualHours && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-medium">{task.actualHours}h / {task.estimatedHours}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${categoryGradient} transition-all duration-500`}
                style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Assigned User & Actions */}
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{task.assignedTo.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <FiUser className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Unassigned</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {task.status === 'SUGGESTED' ? (
              <motion.button
                whileHover={{ scale: isApproving ? 1 : 1.05 }}
                whileTap={{ scale: isApproving ? 1 : 0.95 }}
                onClick={handleApprove}
                disabled={isApproving}
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Approve Task"
              >
                {isApproving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-3.5 h-3.5" />
                    Approve
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: isUnapproving ? 1 : 1.05 }}
                whileTap={{ scale: isUnapproving ? 1 : 0.95 }}
                onClick={handleUnapprove}
                disabled={isUnapproving}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move back to Suggested"
              >
                {isUnapproving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <FiCornerUpLeft className="w-3.5 h-3.5" />
                    Unapprove
                  </>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAssign(task.id)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                task.assignedTo
                  ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-sm'
              }`}
              title={task.assignedTo ? 'Re-assign Task' : 'Assign Task'}
            >
              <FiUserPlus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateTaskModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: projectsData, loading: projectsLoading } = useQuery<ProjectsData>(PROJECTS_QUERY);
  const [createTask, { loading: creating }] = useMutation(CREATE_TASK_MUTATION);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'WEB_FRONTEND',
    priority: 'MEDIUM',
    points: 5,
    estimatedHours: 4,
    projectId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTask({
        variables: {
          input: {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            points: formData.points,
            estimatedHours: formData.estimatedHours,
            projectId: formData.projectId || undefined,
          },
        },
      });

      // Show success toast
      toast.success(
        <div className="flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium">Task Created!</p>
            <p className="text-sm text-gray-600">Your task has been added successfully</p>
          </div>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          },
        }
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <FiAlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium">Error Creating Task</p>
            <p className="text-sm text-gray-600">{error instanceof Error ? error.message : 'Something went wrong'}</p>
          </div>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          },
        }
      );
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
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Decorative Header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold mb-2">Create New Task</h2>
            <p className="text-white/90">Fill in the details below to add a new task</p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Project - Featured at Top */}
          <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 rounded-2xl p-6 border-2 border-violet-200">
            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Project
            </label>
            {projectsLoading ? (
              <div className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-400 text-lg">
                Loading projects...
              </div>
            ) : (
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-5 py-4 text-lg rounded-xl border-2 border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-200 transition-all outline-none bg-white font-medium"
              >
                <option value="">🚫 No Project</option>
                {projectsData?.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    📦 {project.name}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-3 text-sm text-gray-600 font-medium">
              💡 Select the project this task belongs to
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
              placeholder="e.g., Implement user authentication"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
              placeholder="Describe the task in detail..."
            />
          </div>

          {/* Category and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none bg-white"
              >
                <option value="MOBILE_APP">Mobile App</option>
                <option value="WEB_FRONTEND">Web Frontend</option>
                <option value="BACKEND_API">Backend API</option>
                <option value="FULL_STACK">Full Stack</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="DEBUGGING">Debugging</option>
                <option value="CODE_REVIEW">Code Review</option>
                <option value="TESTING_QA">Testing/QA</option>
                <option value="DEVOPS">DevOps</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="CLIENT_COMMUNICATION">Client Communication</option>
                <option value="MENTORING">Mentoring</option>
                <option value="RESEARCH">Research</option>
                <option value="OFFICE_TASKS">Office Tasks</option>
                <option value="MISCELLANEOUS">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Points and Hours Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Story Points *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Hours *
              </label>
              <input
                type="number"
                required
                min="0.5"
                step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={creating}
              whileHover={{ scale: creating ? 1 : 1.02 }}
              whileTap={{ scale: creating ? 1 : 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Task'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function AssignTaskModal({
  task,
  users,
  onClose,
  onAssign
}: {
  task: TasksData['tasks'][0];
  users: User[];
  onClose: () => void;
  onAssign: (userId: string | null) => Promise<void>;
}) {
  const [selectedUser, setSelectedUser] = useState<{ value: string; label: string; email: string } | null>(
    task.assignedTo ? {
      value: task.assignedTo.id,
      label: task.assignedTo.name,
      email: task.assignedTo.email
    } : null
  );
  const [isAssigning, setIsAssigning] = useState(false);

  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    email: user.email,
  }));

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      await onAssign(selectedUser?.value || null);
    } finally {
      setIsAssigning(false);
    }
  };

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '56px',
      borderRadius: '12px',
      borderWidth: '2px',
      borderColor: state.isFocused ? '#9333ea' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(147, 51, 234, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#9333ea',
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#9333ea'
        : state.isFocused
        ? '#f3e8ff'
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      padding: '12px 16px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#9333ea',
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      padding: '8px',
      maxHeight: '240px',
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const formatOptionLabel = ({ label, email }: { label: string; email: string; value: string }) => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
        {label.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );

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
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FiUserPlus className="w-7 h-7" />
              <h2 className="text-2xl font-bold">Assign Task</h2>
            </div>
            <p className="text-white/90 text-sm">Choose a team member for this task</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Task Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl border border-violet-200">
            <p className="text-sm text-gray-600 mb-1">Task</p>
            <p className="font-bold text-gray-800">{task.title}</p>
          </div>

          {/* User Select */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Assign to
            </label>
            <Select
              value={selectedUser}
              onChange={setSelectedUser}
              options={userOptions}
              styles={customStyles}
              formatOptionLabel={formatOptionLabel}
              placeholder="Select a team member..."
              isClearable
              isSearchable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Current Assignment Info */}
          {task.assignedTo && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1">Currently assigned to</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-blue-900">{task.assignedTo.name}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isAssigning}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              onClick={handleAssign}
              disabled={isAssigning}
              whileHover={{ scale: isAssigning ? 1 : 1.02 }}
              whileTap={{ scale: isAssigning ? 1 : 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isAssigning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>{selectedUser ? 'Assign Task' : 'Unassign Task'}</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

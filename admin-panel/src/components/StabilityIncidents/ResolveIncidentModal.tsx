import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSearch, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ResolveIncidentModalProps {
  incident: any;
  tasks: any[];
  onClose: () => void;
  onResolve: (resolutionNotes: string, resolutionTaskId: string) => void;
}

export default function ResolveIncidentModal({ incident, tasks, onClose, onResolve }: ResolveIncidentModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionTaskId, setResolutionTaskId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByIncidentUser, setFilterByIncidentUser] = useState(true);

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = !filterByIncidentUser || task.assignedTo?.id === incident.userId;
    return matchesSearch && matchesUser;
  });

  const handleSubmit = () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    onResolve(resolutionNotes, resolutionTaskId);
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
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
            <FiX className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Resolve Incident</h2>
          <p className="text-white/90 text-sm">{incident.title}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Notes *</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
              placeholder="Describe how this incident was resolved..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Resolution Task (Optional)</label>
              <button
                onClick={() => setFilterByIncidentUser(!filterByIncidentUser)}
                className={`text-xs px-3 py-1 rounded-full transition-all ${
                  filterByIncidentUser
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filterByIncidentUser ? `Filtered by ${incident.user?.name}` : 'All tasks'}
              </button>
            </div>

            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-sm"
                placeholder="Search tasks..."
              />
            </div>

            <div className="border-2 border-gray-200 rounded-xl max-h-48 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No tasks found
                </div>
              ) : (
                filteredTasks.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => setResolutionTaskId(task.id === resolutionTaskId ? '' : task.id)}
                    className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                      task.id === resolutionTaskId
                        ? 'bg-green-50 border-l-4 border-l-green-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          {task.assignedTo?.name} • {task.category?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {task.id === resolutionTaskId && (
                        <FiCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              Mark as Resolved
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

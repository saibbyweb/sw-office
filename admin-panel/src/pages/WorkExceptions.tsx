import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiPlus, FiX, FiCalendar, FiClock, FiEdit2, FiTrash2, FiFilter, FiUser } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import {
  CREATE_WORK_EXCEPTION_MUTATION,
  UPDATE_WORK_EXCEPTION_MUTATION,
  DELETE_WORK_EXCEPTION_MUTATION,
  WORK_EXCEPTIONS_QUERY,
  WORK_EXCEPTION_STATS_QUERY,
} from '../graphql/work-exceptions.mutations';

const exceptionTypeConfig = {
  FULL_DAY_LEAVE: { label: 'Full Day Leave', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  HALF_DAY_LEAVE: { label: 'Half Day Leave', color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  LATE_ARRIVAL: { label: 'Late Arrival', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  EARLY_EXIT: { label: 'Early Exit', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  WORK_FROM_HOME: { label: 'Work From Home', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  SICK_LEAVE: { label: 'Sick Leave', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  EMERGENCY_LEAVE: { label: 'Emergency Leave', color: 'from-rose-500 to-red-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
};

interface WorkExceptionsProps {
  disableDelete?: boolean;
  backPath?: string;
  title?: string;
}

export default function WorkExceptions({
  disableDelete = false,
  backPath = '/',
  title = 'Work Exceptions'
}: WorkExceptionsProps = {}) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editException, setEditException] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    type: 'FULL_DAY_LEAVE',
    date: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    actualTime: '',
    reason: '',
    notes: '',
    compensationDate: '',
  });

  const { data: usersData } = useQuery(ADMIN_USERS_QUERY);
  const { data: exceptionsData, refetch: refetchExceptions } = useQuery(WORK_EXCEPTIONS_QUERY, {
    variables: {
      userId: selectedUser,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type: selectedType || undefined,
    },
  });
  const { data: statsData } = useQuery(WORK_EXCEPTION_STATS_QUERY, {
    variables: {
      userId: selectedUser,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  });

  const [createException] = useMutation(CREATE_WORK_EXCEPTION_MUTATION, {
    onCompleted: () => {
      toast.success('Work exception created successfully');
      setShowCreateModal(false);
      resetForm();
      refetchExceptions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [updateException] = useMutation(UPDATE_WORK_EXCEPTION_MUTATION, {
    onCompleted: () => {
      toast.success('Work exception updated successfully');
      setEditException(null);
      resetForm();
      refetchExceptions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [deleteException] = useMutation(DELETE_WORK_EXCEPTION_MUTATION, {
    onCompleted: () => {
      toast.success('Work exception deleted successfully');
      refetchExceptions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      userId: '',
      type: 'FULL_DAY_LEAVE',
      date: new Date().toISOString().split('T')[0],
      scheduledTime: '',
      actualTime: '',
      reason: '',
      notes: '',
      compensationDate: '',
    });
  };

  const handleSubmit = () => {
    const isTimeBased = formData.type === 'LATE_ARRIVAL' || formData.type === 'EARLY_EXIT';

    if (!formData.userId || !formData.type || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isTimeBased && (!formData.scheduledTime || !formData.actualTime)) {
      toast.error('Scheduled time and actual time are required for late arrival/early exit');
      return;
    }

    const variables: any = {
      userId: formData.userId,
      type: formData.type,
      date: formData.date,
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
      compensationDate: formData.compensationDate || undefined,
    };

    if (isTimeBased) {
      variables.scheduledTime = `${formData.date}T${formData.scheduledTime}:00.000Z`;
      variables.actualTime = `${formData.date}T${formData.actualTime}:00.000Z`;
    }

    if (editException) {
      updateException({ variables: { id: editException.id, ...variables } });
    } else {
      createException({ variables });
    }
  };

  const handleEdit = (exception: any) => {
    setEditException(exception);
    const isTimeBased = exception.type === 'LATE_ARRIVAL' || exception.type === 'EARLY_EXIT';

    setFormData({
      userId: exception.userId,
      type: exception.type,
      date: new Date(exception.date).toISOString().split('T')[0],
      scheduledTime: isTimeBased && exception.scheduledTime ? new Date(exception.scheduledTime).toISOString().split('T')[1].substring(0, 5) : '',
      actualTime: isTimeBased && exception.actualTime ? new Date(exception.actualTime).toISOString().split('T')[1].substring(0, 5) : '',
      reason: exception.reason || '',
      notes: exception.notes || '',
      compensationDate: exception.compensationDate ? new Date(exception.compensationDate).toISOString().split('T')[0] : '',
    });
    setShowCreateModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this work exception?')) {
      deleteException({ variables: { id } });
    }
  };

  const isTimeBased = formData.type === 'LATE_ARRIVAL' || formData.type === 'EARLY_EXIT';

  const userOptions = usersData?.adminUsers
    .filter((u: any) => !u.archived)
    .map((user: any) => ({
      value: user.id,
      label: user.name,
    })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(backPath)} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors">
                <FiArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text">
                {title}
              </h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditException(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Log Exception
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters & Stats */}
        <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/40 p-4 mb-6">
          <div className="flex items-center justify-between gap-6">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-1">
              <FiFilter className="w-4 h-4 text-violet-600" />
              <div className="w-48">
                <Select
                  isClearable
                  placeholder="All Users"
                  options={userOptions}
                  onChange={(option: any) => setSelectedUser(option?.value || null)}
                  className="text-sm"
                />
              </div>
              <div className="w-48">
                <Select
                  isClearable
                  placeholder="All Types"
                  options={Object.entries(exceptionTypeConfig).map(([key, value]) => ({
                    value: key,
                    label: value.label,
                  }))}
                  onChange={(option: any) => setSelectedType(option?.value || null)}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Stats */}
            {statsData?.workExceptionStats && (
              <div className="flex gap-3">
                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg px-4 py-2 border border-violet-200">
                  <p className="text-xs font-medium text-violet-700">Total</p>
                  <p className="text-xl font-bold text-violet-900">{statsData.workExceptionStats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg px-4 py-2 border border-red-200">
                  <p className="text-xs font-medium text-red-700">Full Day</p>
                  <p className="text-xl font-bold text-red-900">{statsData.workExceptionStats.fullDayLeaves}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg px-4 py-2 border border-orange-200">
                  <p className="text-xs font-medium text-orange-700">Half Day</p>
                  <p className="text-xl font-bold text-orange-900">{statsData.workExceptionStats.halfDayLeaves}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exceptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exceptionsData?.workExceptions.map((exception: any) => {
            const config = exceptionTypeConfig[exception.type as keyof typeof exceptionTypeConfig];
            const isTimeException = exception.type === 'LATE_ARRIVAL' || exception.type === 'EARLY_EXIT';

            return (
              <motion.div
                key={exception.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${config.color} text-white text-xs font-semibold mb-2`}>
                      {config.label}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiUser className="w-3.5 h-3.5" />
                      <span className="font-medium">{exception.user.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(exception)}
                      className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    {!disableDelete && (
                      <button
                        onClick={() => handleDelete(exception.id)}
                        className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FiCalendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-700">{new Date(exception.date).toLocaleDateString()}</span>
                  </div>

                  {isTimeException && exception.scheduledTime && exception.actualTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <FiClock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-gray-700">
                        {new Date(exception.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(exception.actualTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {exception.compensationDate && (
                    <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded-lg border border-green-200">
                      <FiCalendar className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-700 font-medium">
                        Compensated on: {new Date(exception.compensationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {exception.reason && (
                    <p className="text-xs text-gray-600 mt-2 p-2 bg-white/50 rounded-lg">
                      <span className="font-medium">Reason:</span> {exception.reason}
                    </p>
                  )}

                  {exception.notes && (
                    <p className="text-xs text-gray-600 p-2 bg-white/50 rounded-lg">
                      <span className="font-medium">Notes:</span> {exception.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!exceptionsData?.workExceptions || exceptionsData.workExceptions.length === 0) && (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white/60 backdrop-blur-md rounded-2xl border-2 border-dashed border-gray-300">
            <FiCalendar className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No work exceptions found</p>
            <p className="text-gray-400 text-sm">Click "Log Exception" to add one</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              setEditException(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">
                  {editException ? 'Edit Work Exception' : 'Log Work Exception'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditException(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={userOptions.find((opt: any) => opt.value === formData.userId)}
                    onChange={(option) => setFormData({ ...formData, userId: option?.value || '' })}
                    options={userOptions}
                    placeholder="Select user"
                  />
                </div>

                {/* Exception Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exception Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={{
                      value: formData.type,
                      label: exceptionTypeConfig[formData.type as keyof typeof exceptionTypeConfig].label,
                    }}
                    onChange={(option) => setFormData({ ...formData, type: option?.value || 'FULL_DAY_LEAVE' })}
                    options={Object.entries(exceptionTypeConfig).map(([key, value]) => ({
                      value: key,
                      label: value.label,
                    }))}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Time fields for Late Arrival / Early Exit */}
                {isTimeBased && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Scheduled Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Actual Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={formData.actualTime}
                        onChange={(e) => setFormData({ ...formData, actualTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Compensation Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Compensation Date <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.compensationDate}
                    onChange={(e) => setFormData({ ...formData, compensationDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">The date when the employee worked to compensate for this exception</p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
                    placeholder="Why did this exception occur?"
                  />
                </div>

                {/* Notes (Admin) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none"
                    placeholder="Internal notes (optional)"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    {editException ? 'Update Exception' : 'Log Exception'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditException(null);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
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

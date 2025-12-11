import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiPlus, FiX, FiCalendar, FiEdit2, FiTrash2, FiFilter, FiUser, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import ResolveIncidentModal from '../components/StabilityIncidents/ResolveIncidentModal';
import DeleteConfirmationModal from '../components/StabilityIncidents/DeleteConfirmationModal';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import { TASKS_QUERY } from '../graphql/tasks.mutations';
import {
  CREATE_STABILITY_INCIDENT_MUTATION,
  UPDATE_STABILITY_INCIDENT_MUTATION,
  DELETE_STABILITY_INCIDENT_MUTATION,
  RESOLVE_STABILITY_INCIDENT_MUTATION,
  UNRESOLVE_STABILITY_INCIDENT_MUTATION,
  STABILITY_INCIDENTS_QUERY,
} from '../graphql/stability-incidents.mutations';

const severityConfig = {
  CRITICAL: { label: 'Critical', color: 'from-red-600 to-rose-600', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700' },
  HIGH: { label: 'High', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700' },
  MEDIUM: { label: 'Medium', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700' },
  LOW: { label: 'Low', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700' },
  NEGLIGIBLE: { label: 'Negligible', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-300', textColor: 'text-gray-700' },
};

const incidentTypeConfig = {
  PRODUCTION_BUG: { label: 'Production Bug', icon: '🐛' },
  SECURITY_VULNERABILITY: { label: 'Security Vulnerability', icon: '🔒' },
  PERFORMANCE_ISSUE: { label: 'Performance Issue', icon: '⚡' },
  DATA_CORRUPTION: { label: 'Data Corruption', icon: '💾' },
  DEPLOYMENT_FAILURE: { label: 'Deployment Failure', icon: '🚀' },
  BREAKING_CHANGE: { label: 'Breaking Change', icon: '💥' },
  TEST_FAILURE: { label: 'Test Failure', icon: '🧪' },
  CODE_QUALITY_ISSUE: { label: 'Code Quality Issue', icon: '📝' },
  HOTFIX_REQUIRED: { label: 'Hotfix Required', icon: '🔥' },
  REGRESSION: { label: 'Regression', icon: '↩️' },
};

interface StabilityIncidentsProps {
  backPath?: string;
  title?: string;
}

export default function StabilityIncidents({
  backPath = '/',
  title = 'Stability Incidents'
}: StabilityIncidentsProps = {}) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editIncident, setEditIncident] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState<boolean | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [resolveModalIncident, setResolveModalIncident] = useState<any>(null);
  const [deleteModalIncident, setDeleteModalIncident] = useState<any>(null);

  const [formData, setFormData] = useState({
    userId: '',
    taskId: '',
    type: 'PRODUCTION_BUG',
    severity: 'MEDIUM',
    title: '',
    description: '',
    incidentDate: Math.floor(Date.now() / 1000),
    rootCause: '',
    preventionPlan: '',
    adminNotes: '',
    screenshots: [] as string[],
    logLinks: [] as string[],
  });

  const { data: usersData } = useQuery(ADMIN_USERS_QUERY);
  const { data: tasksData } = useQuery(TASKS_QUERY);

  const filters: any = {};
  if (selectedUser) filters.userId = selectedUser;
  if (selectedSeverity) filters.severity = selectedSeverity;
  if (selectedType) filters.type = selectedType;
  if (showResolved !== null) filters.resolved = showResolved;
  if (startDate) filters.startDate = Math.floor(new Date(startDate).getTime() / 1000);
  if (endDate) filters.endDate = Math.floor(new Date(endDate).getTime() / 1000);

  const { data: incidentsData } = useQuery(STABILITY_INCIDENTS_QUERY, {
    variables: { filters: Object.keys(filters).length > 0 ? filters : undefined },
  });

  const [createIncident] = useMutation(CREATE_STABILITY_INCIDENT_MUTATION, {
    refetchQueries: [{ query: STABILITY_INCIDENTS_QUERY, variables: { filters: Object.keys(filters).length > 0 ? filters : undefined } }],
    onCompleted: () => {
      toast.success('Incident created successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const [updateIncident] = useMutation(UPDATE_STABILITY_INCIDENT_MUTATION, {
    refetchQueries: [{ query: STABILITY_INCIDENTS_QUERY, variables: { filters: Object.keys(filters).length > 0 ? filters : undefined } }],
    onCompleted: () => {
      toast.success('Incident updated successfully');
      setShowCreateModal(false);
      setEditIncident(null);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const [deleteIncident] = useMutation(DELETE_STABILITY_INCIDENT_MUTATION, {
    refetchQueries: [{ query: STABILITY_INCIDENTS_QUERY, variables: { filters: Object.keys(filters).length > 0 ? filters : undefined } }],
    onCompleted: () => {
      toast.success('Incident deleted successfully');
      setDeleteModalIncident(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const [resolveIncident] = useMutation(RESOLVE_STABILITY_INCIDENT_MUTATION, {
    refetchQueries: [{ query: STABILITY_INCIDENTS_QUERY, variables: { filters: Object.keys(filters).length > 0 ? filters : undefined } }],
    onCompleted: () => {
      toast.success('Incident marked as resolved');
      setResolveModalIncident(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const [unresolveIncident] = useMutation(UNRESOLVE_STABILITY_INCIDENT_MUTATION, {
    refetchQueries: [{ query: STABILITY_INCIDENTS_QUERY, variables: { filters: Object.keys(filters).length > 0 ? filters : undefined } }],
    onCompleted: () => {
      toast.success('Incident reopened');
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({
      userId: '',
      taskId: '',
      type: 'PRODUCTION_BUG',
      severity: 'MEDIUM',
      title: '',
      description: '',
      incidentDate: Math.floor(Date.now() / 1000),
      rootCause: '',
      preventionPlan: '',
      adminNotes: '',
      screenshots: [],
      logLinks: [],
    });
  };

  const handleSubmit = () => {
    if (!formData.userId || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const baseInput = {
      taskId: formData.taskId || undefined,
      type: formData.type,
      severity: formData.severity,
      title: formData.title,
      description: formData.description,
      incidentDate: formData.incidentDate,
      rootCause: formData.rootCause || undefined,
      preventionPlan: formData.preventionPlan || undefined,
      adminNotes: formData.adminNotes || undefined,
      screenshots: formData.screenshots.length > 0 ? formData.screenshots : undefined,
      logLinks: formData.logLinks.length > 0 ? formData.logLinks : undefined,
    };

    console.log('Submitting incident with date:', {
      incidentDate: baseInput.incidentDate,
      asDate: new Date(baseInput.incidentDate * 1000).toISOString(),
      formDataDate: formData.incidentDate,
    });

    if (editIncident) {
      updateIncident({ variables: { id: editIncident.id, input: baseInput } });
    } else {
      createIncident({ variables: { input: { ...baseInput, userId: formData.userId } } });
    }
  };

  const handleEdit = (incident: any) => {
    setEditIncident(incident);
    setFormData({
      userId: incident.userId,
      taskId: incident.taskId || '',
      type: incident.type,
      severity: incident.severity,
      title: incident.title,
      description: incident.description,
      incidentDate: incident.incidentDate,
      rootCause: incident.rootCause || '',
      preventionPlan: incident.preventionPlan || '',
      adminNotes: incident.adminNotes || '',
      screenshots: incident.screenshots || [],
      logLinks: incident.logLinks || [],
    });
    setShowCreateModal(true);
  };

  const incidents = incidentsData?.stabilityIncidents || [];
  const unresolvedCount = incidents.filter((i: any) => !i.resolvedAt).length;

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
              <div>
                <h1 className="text-lg font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text">
                  {title}
                </h1>
                <p className="text-xs text-gray-600">{unresolvedCount} unresolved incidents</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditIncident(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <FiPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Log Incident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6">
        <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/40">
          <div className="flex items-center gap-2 mb-3">
            <FiFilter className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select
              isClearable
              placeholder="User"
              options={usersData?.adminUsers?.filter((u: any) => !u.archived).map((u: any) => ({ value: u.id, label: u.name }))}
              onChange={(option: any) => setSelectedUser(option?.value || null)}
            />
            <Select
              isClearable
              placeholder="Severity"
              options={Object.entries(severityConfig).map(([key, val]) => ({ value: key, label: val.label }))}
              onChange={(option) => setSelectedSeverity(option?.value || null)}
            />
            <Select
              isClearable
              placeholder="Type"
              options={Object.entries(incidentTypeConfig).map(([key, val]) => ({ value: key, label: val.label }))}
              onChange={(option) => setSelectedType(option?.value || null)}
            />
            <Select
              isClearable
              placeholder="Status"
              options={[
                { value: false, label: 'Unresolved' },
                { value: true, label: 'Resolved' },
              ]}
              onChange={(option) => setShowResolved(option?.value ?? null)}
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                placeholder="Start date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none"
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.map((incident: any, index: number) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              index={index}
              onEdit={handleEdit}
              onDelete={(incident: any) => setDeleteModalIncident(incident)}
              onResolve={(incident: any) => setResolveModalIncident(incident)}
              onUnresolve={(id: string) => unresolveIncident({ variables: { id } })}
            />
          ))}
          {incidents.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-center">
              <FiAlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No incidents found</p>
              <p className="text-gray-400 text-sm">Log your first incident to start tracking stability</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <IncidentModal
            formData={formData}
            setFormData={setFormData}
            isEdit={!!editIncident}
            users={usersData?.adminUsers?.filter((u: any) => !u.archived) || []}
            tasks={tasksData?.tasks?.tasks || []}
            onClose={() => {
              setShowCreateModal(false);
              setEditIncident(null);
              resetForm();
            }}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveModalIncident && (
          <ResolveIncidentModal
            incident={resolveModalIncident}
            tasks={tasksData?.tasks?.tasks || []}
            onClose={() => setResolveModalIncident(null)}
            onResolve={(resolutionNotes, resolutionTaskId) => {
              resolveIncident({
                variables: {
                  id: resolveModalIncident.id,
                  resolutionNotes,
                  resolvedAt: Math.floor(Date.now() / 1000),
                  resolutionTaskId: resolutionTaskId || undefined,
                },
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalIncident && (
          <DeleteConfirmationModal
            incident={deleteModalIncident}
            onClose={() => setDeleteModalIncident(null)}
            onConfirm={() => deleteIncident({ variables: { id: deleteModalIncident.id } })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IncidentCard({ incident, index, onEdit, onDelete, onResolve, onUnresolve }: any) {
  const severityInfo = severityConfig[incident.severity as keyof typeof severityConfig];
  const typeInfo = incidentTypeConfig[incident.type as keyof typeof incidentTypeConfig];
  const isResolved = !!incident.resolvedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white/80 backdrop-blur-md rounded-xl p-4 border-2 ${severityInfo.borderColor} ${isResolved ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{typeInfo.icon}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityInfo.bgColor} ${severityInfo.textColor}`}>
              {severityInfo.label}
            </span>
            {isResolved && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                <FiCheckCircle className="w-3 h-3" />
                Resolved
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm">{incident.title}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{incident.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <FiUser className="w-3 h-3" />
          <span>{incident.user?.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <FiCalendar className="w-3 h-3" />
          <span>{new Date(incident.incidentDate * 1000).toLocaleDateString()}</span>
        </div>
        {incident.task && (
          <div className="text-xs text-violet-600">
            Task: {incident.task.title}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(incident)}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <FiEdit2 className="w-3 h-3 inline mr-1" />
          Edit
        </button>
        {isResolved ? (
          <button
            onClick={() => onUnresolve(incident.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
          >
            Reopen
          </button>
        ) : (
          <button
            onClick={() => onResolve(incident)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
          >
            Resolve
          </button>
        )}
        <button
          onClick={() => onDelete(incident)}
          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
        >
          <FiTrash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

function IncidentModal({ formData, setFormData, isEdit, users, tasks, onClose, onSubmit }: any) {
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
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
            <FiX className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit' : 'Log'} Incident</h2>
          <p className="text-white/90 text-sm">Document a stability incident</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">User *</label>
              <Select
                value={users.find((u: any) => u.id === formData.userId) ? { value: formData.userId, label: users.find((u: any) => u.id === formData.userId)?.name } : null}
                onChange={(option: any) => setFormData({ ...formData, userId: option?.value || '' })}
                options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                placeholder="Select user..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Related Task (Optional)</label>
              <Select
                isClearable
                value={tasks.find((t: any) => t.id === formData.taskId) ? { value: formData.taskId, label: tasks.find((t: any) => t.id === formData.taskId)?.title } : null}
                onChange={(option: any) => setFormData({ ...formData, taskId: option?.value || '' })}
                options={tasks.map((t: any) => ({ value: t.id, label: t.title }))}
                placeholder="Select task..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none bg-white"
              >
                {Object.entries(incidentTypeConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none bg-white"
              >
                {Object.entries(severityConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
              placeholder="Brief title of the incident"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
              placeholder="Detailed description of what happened"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Root Cause</label>
              <textarea
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
                placeholder="What caused this incident"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prevention Plan</label>
              <textarea
                value={formData.preventionPlan}
                onChange={(e) => setFormData({ ...formData, preventionPlan: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
                placeholder="How to prevent this in future"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
              placeholder="Additional notes"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Date *</label>
            <input
              type="datetime-local"
              value={new Date(formData.incidentDate * 1000).toISOString().slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, incidentDate: Math.floor(new Date(e.target.value).getTime() / 1000) })}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              {isEdit ? 'Update' : 'Create'} Incident
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

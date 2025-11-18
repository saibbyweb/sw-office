import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { FiUser, FiArrowLeft, FiPlus, FiX, FiMail, FiLock, FiUserPlus, FiArchive, FiKey, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import { gql } from '@apollo/client';
import { AdminUser } from '../types/admin.types';
import toast, { Toaster } from 'react-hot-toast';

interface AdminUsersData {
  adminUsers: AdminUser[];
}

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

const UPDATE_PASSWORD_MUTATION = gql`
  mutation AdminUpdateUserPassword($userId: ID!, $newPassword: String!) {
    adminUpdateUserPassword(userId: $userId, newPassword: $newPassword) {
      id
      name
    }
  }
`;

const ARCHIVE_USER_MUTATION = gql`
  mutation AdminArchiveUser($userId: ID!, $archived: Boolean!) {
    adminArchiveUser(userId: $userId, archived: $archived) {
      id
      name
      archived
    }
  }
`;

export default function Team() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'unarchive' | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const { data, loading, refetch } = useQuery<AdminUsersData>(ADMIN_USERS_QUERY);
  const [register, { loading: registerLoading }] = useMutation(REGISTER_MUTATION);
  const [updatePassword, { loading: updatePasswordLoading }] = useMutation(UPDATE_PASSWORD_MUTATION);
  const [archiveUser, { loading: archiveLoading }] = useMutation(ARCHIVE_USER_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Adding team member...');
    try {
      await register({
        variables: {
          input: formData,
        },
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '' });
      refetch();
      toast.success('Team member added successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to add team member', { id: toastId });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const toastId = toast.loading('Updating password...');
    try {
      await updatePassword({
        variables: {
          userId: selectedUser!.id,
          newPassword: passwordData.newPassword,
        },
      });
      setShowPasswordModal(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
      toast.success('Password updated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password', { id: toastId });
    }
  };

  const handleArchiveConfirm = async () => {
    if (!selectedUser) return;

    const toastId = toast.loading(confirmAction === 'archive' ? 'Archiving user...' : 'Unarchiving user...');
    try {
      await archiveUser({
        variables: {
          userId: selectedUser.id,
          archived: confirmAction === 'archive',
        },
      });
      setShowConfirmDialog(false);
      setSelectedUser(null);
      setConfirmAction(null);
      refetch();
      toast.success(
        confirmAction === 'archive' ? 'User archived successfully!' : 'User unarchived successfully!',
        { id: toastId }
      );
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error(error.message || 'Failed to update user status', { id: toastId });
    }
  };

  const openArchiveDialog = (user: AdminUser, action: 'archive' | 'unarchive') => {
    setSelectedUser(user);
    setConfirmAction(action);
    setShowConfirmDialog(true);
    setOpenMenuId(null);
  };

  const openPasswordDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setOpenMenuId(null);
  };

  const filteredUsers = data?.adminUsers.filter(user =>
    showArchived ? true : !user.archived
  ) || [];

  const archivedCount = data?.adminUsers.filter(user => user.archived).length || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white/40 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                title="Back to Home"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
                  Team Members
                </h1>
                <p className="text-xs text-gray-600">
                  Manage your team members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {archivedCount > 0 && (
                <label className="flex items-center gap-2 cursor-pointer bg-white/40 backdrop-blur-md px-3 py-2 rounded-lg border border-white/20 hover:bg-white/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-700">
                    Show archived ({archivedCount})
                  </span>
                </label>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 text-sm font-medium shadow-md"
              >
                <FiPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-white/40 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:shadow-lg hover:border-white/40 transition-all duration-300 group relative ${
                  user.archived ? 'opacity-60' : ''
                }`}
              >
                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <FiMoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === user.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => openPasswordDialog(user)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <FiKey className="w-4 h-4" />
                          Change Password
                        </button>
                        <button
                          onClick={() => openArchiveDialog(user, user.archived ? 'unarchive' : 'archive')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <FiArchive className="w-4 h-4" />
                          {user.archived ? 'Unarchive' : 'Archive'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-20 h-20 rounded-full ring-4 ring-white/50 group-hover:ring-violet-500/30 transition-all mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center ring-4 ring-white/50 group-hover:ring-violet-500/30 transition-all mb-4">
                      <FiUser className="w-10 h-10 text-violet-600" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 text-center">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-600">
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {user.currentStatus && (
                    <div className="mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                      {user.currentStatus}
                    </div>
                  )}
                  {user.archived && (
                    <div className="mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Archived
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredUsers.length === 0 && data?.adminUsers && data.adminUsers.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FiArchive className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">All users are archived</p>
            <button
              onClick={() => setShowArchived(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 text-sm font-medium"
            >
              <FiArchive className="w-4 h-4" />
              Show Archived Users
            </button>
          </div>
        )}

        {!loading && data?.adminUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FiUserPlus className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">No team members yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Add First Member
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Add Team Member</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password will be encrypted using bcrypt
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Change Password</h2>
                  <p className="text-sm text-blue-100 mt-1">{selectedUser.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                    setSelectedUser(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePasswordLoading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePasswordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 ${confirmAction === 'archive' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${confirmAction === 'archive' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  <FiArchive className={`w-6 h-6 ${confirmAction === 'archive' ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {confirmAction === 'archive' ? 'Archive User?' : 'Unarchive User?'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUser.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                {confirmAction === 'archive'
                  ? 'Are you sure you want to archive this user? They will no longer have access to the system.'
                  : 'Are you sure you want to restore access for this user?'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setSelectedUser(null);
                    setConfirmAction(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  disabled={archiveLoading}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmAction === 'archive'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  {archiveLoading ? 'Processing...' : confirmAction === 'archive' ? 'Archive User' : 'Unarchive User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

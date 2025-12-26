import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { FiArrowLeft, FiPlus, FiX, FiDollarSign, FiEdit2, FiTrash2, FiFilter, FiCheck, FiUpload, FiFileText, FiImage, FiGrid, FiList } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import {
  PAGINATED_EXPENSES_QUERY,
  CREATE_EXPENSE_MUTATION,
  UPDATE_EXPENSE_MUTATION,
  DELETE_EXPENSE_MUTATION,
  APPROVE_EXPENSE_MUTATION,
  MARK_EXPENSE_AS_PAID_MUTATION,
  MARK_EXPENSE_AS_PENDING_MUTATION,
} from '../graphql/expenses.mutations';
import { uploadFileToS3 } from '../utils/uploadToS3';

const expenseTypeConfig = {
  COMPANY_EXPENSE: { label: 'Company Expense', color: 'from-gray-600 to-gray-800', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  REIMBURSEMENT: { label: 'Reimbursement', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  EMPLOYEE_BENEFIT: { label: 'Employee Benefit', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
};

const categoryConfig = {
  OFFICE_SUPPLIES: { label: 'Office Supplies', icon: '📦' },
  EQUIPMENT: { label: 'Equipment', icon: '💻' },
  SOFTWARE_LICENSES: { label: 'Software Licenses', icon: '⚙️' },
  TRAVEL: { label: 'Travel', icon: '✈️' },
  MEALS: { label: 'Meals', icon: '🍽️' },
  ENTERTAINMENT: { label: 'Entertainment', icon: '🎉' },
  UTILITIES: { label: 'Utilities', icon: '💡' },
  INTERNET_PHONE: { label: 'Internet & Phone', icon: '📱' },
  RENT: { label: 'Rent', icon: '🏢' },
  MARKETING: { label: 'Marketing', icon: '📢' },
  PROFESSIONAL_SERVICES: { label: 'Professional Services', icon: '👔' },
  EMPLOYEE_PERKS: { label: 'Employee Perks', icon: '🎁' },
  MISCELLANEOUS: { label: 'Miscellaneous', icon: '📋' },
};

const statusConfig = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  APPROVED: { label: 'Approved', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  PAID: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  NOT_APPLICABLE: { label: 'N/A', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
};

export default function Expenses() {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'paid' | 'delete' | 'pending';
    id: string;
    title: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    expenseType: 'COMPANY_EXPENSE',
    category: 'OFFICE_SUPPLIES',
    amount: '',
    currency: 'INR',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 16),
    relatedEmployeeId: '',
    receiptUrl: '',
    invoiceNumber: '',
    vendor: '',
    notes: '',
  });

  const { data: usersData } = useQuery(ADMIN_USERS_QUERY);

  const filters: any = {};
  if (selectedType) filters.expenseType = selectedType;
  if (selectedCategory) filters.category = selectedCategory;
  if (selectedEmployee) filters.relatedEmployeeId = selectedEmployee;
  if (selectedStatus) filters.reimbursementStatus = selectedStatus;
  if (startDate) filters.startDate = Math.floor(new Date(startDate).getTime() / 1000);
  if (endDate) filters.endDate = Math.floor(new Date(endDate).getTime() / 1000);

  const { loading: expensesLoading, fetchMore, refetch } = useQuery(PAGINATED_EXPENSES_QUERY, {
    variables: {
      filters: {
        ...filters,
        skip: 0,
        take: 20
      }
    },
    onCompleted: (data) => {
      setAllExpenses(data.paginatedExpenses.expenses);
      setHasMore(data.paginatedExpenses.hasMore);
    },
    notifyOnNetworkStatusChange: true,
  });

  const refetchExpenses = useCallback(async () => {
    const { data } = await refetch({
      filters: {
        ...filters,
        skip: 0,
        take: 20,
      },
    });
    if (data) {
      setAllExpenses(data.paginatedExpenses.expenses);
      setHasMore(data.paginatedExpenses.hasMore);
    }
  }, [refetch, filters]);

  const [createExpense] = useMutation(CREATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense created successfully', { duration: 3000 });
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [updateExpense] = useMutation(UPDATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense updated successfully', { duration: 3000 });
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [deleteExpense, { loading: deleteLoading }] = useMutation(DELETE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense deleted successfully');
      setConfirmAction(null);
      refetchExpenses();
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const [approveExpense, { loading: approveLoading }] = useMutation(APPROVE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense approved');
      setConfirmAction(null);
      refetchExpenses();
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const [markAsPaid, { loading: paidLoading }] = useMutation(MARK_EXPENSE_AS_PAID_MUTATION, {
    onCompleted: () => {
      toast.success('Marked as paid');
      setConfirmAction(null);
      refetchExpenses();
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const [markAsPending, { loading: pendingLoading }] = useMutation(MARK_EXPENSE_AS_PENDING_MUTATION, {
    onCompleted: () => {
      toast.success('Marked as pending');
      setConfirmAction(null);
      refetchExpenses();
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const resetForm = () => {
    setFormData({
      expenseType: 'COMPANY_EXPENSE',
      category: 'OFFICE_SUPPLIES',
      amount: '',
      currency: 'INR',
      description: '',
      expenseDate: new Date().toISOString().slice(0, 16),
      relatedEmployeeId: '',
      receiptUrl: '',
      invoiceNumber: '',
      vendor: '',
      notes: '',
    });
  };

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);

    try {
      // Upload to S3 using presigned URL
      const fileUrl = await uploadFileToS3(file, apolloClient);
      setFormData({ ...formData, receiptUrl: fileUrl });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const input: any = {
      expenseType: formData.expenseType,
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      expenseDate: Math.floor(new Date(formData.expenseDate + ':00.000Z').getTime() / 1000),
      relatedEmployeeId: formData.relatedEmployeeId || undefined,
      receiptUrl: formData.receiptUrl || undefined,
      invoiceNumber: formData.invoiceNumber || undefined,
      vendor: formData.vendor || undefined,
      notes: formData.notes || undefined,
    };

    // Hide modal immediately to avoid confusion
    setShowCreateModal(false);
    resetForm();
    if (editExpense) {
      setEditExpense(null);
    }

    if (editExpense) {
      updateExpense({ variables: { id: editExpense.id, input } });
    } else {
      createExpense({ variables: { input, createdById: usersData?.adminUsers[0]?.id || '123' } });
    }
  };

  const handleEdit = (expense: any) => {
    setEditExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      description: expense.description,
      expenseDate: new Date(expense.expenseDate * 1000).toISOString().slice(0, 16),
      relatedEmployeeId: expense.relatedEmployeeId || '',
      receiptUrl: expense.receiptUrl || '',
      invoiceNumber: expense.invoiceNumber || '',
      vendor: expense.vendor || '',
      notes: expense.notes || '',
    });
    setShowCreateModal(true);
  };

  const confirmDelete = (id: string, description: string) => {
    setConfirmAction({ type: 'delete', id, title: description });
  };

  const confirmApprove = (id: string, description: string) => {
    setConfirmAction({ type: 'approve', id, title: description });
  };

  const confirmMarkPaid = (id: string, description: string) => {
    setConfirmAction({ type: 'paid', id, title: description });
  };

  const confirmMarkPending = (id: string, description: string) => {
    setConfirmAction({ type: 'pending', id, title: description });
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'approve':
        approveExpense({ variables: { id: confirmAction.id, approvedById: usersData?.adminUsers[0]?.id || '123' } });
        break;
      case 'paid':
        markAsPaid({ variables: { id: confirmAction.id } });
        break;
      case 'pending':
        markAsPending({ variables: { id: confirmAction.id } });
        break;
      case 'delete':
        deleteExpense({ variables: { id: confirmAction.id } });
        break;
    }
  };

  // Load more expenses when scrolling
  const loadMoreExpenses = useCallback(() => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    fetchMore({
      variables: {
        filters: {
          ...filters,
          skip: allExpenses.length,
          take: 20,
        },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        setLoadingMore(false);
        if (!fetchMoreResult) return prev;

        const newExpenses = fetchMoreResult.paginatedExpenses.expenses;
        setAllExpenses((prevExpenses) => [...prevExpenses, ...newExpenses]);
        setHasMore(fetchMoreResult.paginatedExpenses.hasMore);

        return {
          paginatedExpenses: {
            ...fetchMoreResult.paginatedExpenses,
            expenses: [...allExpenses, ...newExpenses],
          },
        };
      },
    });
  }, [fetchMore, filters, allExpenses, hasMore, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreExpenses();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMoreExpenses]);

  // Reset when filters change
  useEffect(() => {
    refetchExpenses();
  }, [selectedType, selectedCategory, selectedEmployee, selectedStatus, startDate, endDate]);

  const expenses = [...allExpenses].sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Group expenses by date categories
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayTimestamp = Math.floor(yesterdayStart.getTime() / 1000);

  const todayExpenses = expenses.filter((e: any) => e.expenseDate >= todayTimestamp);
  const yesterdayExpenses = expenses.filter((e: any) => e.expenseDate >= yesterdayTimestamp && e.expenseDate < todayTimestamp);
  const olderExpenses = expenses.filter((e: any) => e.expenseDate < yesterdayTimestamp);

  const userOptions = usersData?.adminUsers?.map((user: any) => ({
    value: user.id,
    label: user.name,
  })) || [];

  const actionLoading = approveLoading || paidLoading || deleteLoading || pendingLoading;

  // Helper function to render expense rows
  const renderExpenseRow = (expense: any) => {
    const catConfig = categoryConfig[expense.category as keyof typeof categoryConfig];
    const statConfig = statusConfig[expense.reimbursementStatus as keyof typeof statusConfig];

    return (
      <div
        key={expense.id}
        className="bg-white/80 backdrop-blur-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Date */}
          <div className="text-base font-semibold text-gray-800 whitespace-nowrap shrink-0 w-24">
            {new Date(expense.expenseDate * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          {/* Description */}
          <div className="text-base font-semibold text-gray-900 truncate shrink-0 w-52">
            {expense.description}
          </div>

          {/* Category */}
          <div className="text-base font-medium text-gray-700 whitespace-nowrap shrink-0 w-40">
            {catConfig.icon} {catConfig.label}
          </div>

          {/* Employee (if exists) */}
          <div className="text-base font-medium text-gray-700 whitespace-nowrap shrink-0 w-36">
            {expense.relatedEmployee ? `👤 ${expense.relatedEmployee.name}` : '—'}
          </div>

          {/* Vendor (if exists) */}
          <div className="text-base font-medium text-gray-700 whitespace-nowrap shrink-0 w-36 truncate">
            {expense.vendor ? `🏪 ${expense.vendor}` : '—'}
          </div>

          {/* Amount */}
          <div className="text-lg font-bold text-gray-900 whitespace-nowrap shrink-0 w-28 text-right">
            {expense.currency} {expense.amount.toLocaleString()}
          </div>

          {/* Status */}
          <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-semibold ${statConfig.bgColor} ${statConfig.color} ${statConfig.borderColor} border whitespace-nowrap shrink-0 w-20 justify-center`}>
            {statConfig.label}
          </span>

          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'PENDING' && (
              <button
                onClick={() => confirmApprove(expense.id, expense.description)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve"
              >
                <FiCheck className="w-4 h-4" />
              </button>
            )}
            {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'APPROVED' && (
              <button
                onClick={() => confirmMarkPaid(expense.id, expense.description)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Mark as Paid"
              >
                <FiDollarSign className="w-4 h-4" />
              </button>
            )}
            {expense.expenseType === 'REIMBURSEMENT' && (expense.reimbursementStatus === 'APPROVED' || expense.reimbursementStatus === 'PAID') && (
              <button
                onClick={() => confirmMarkPending(expense.id, expense.description)}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Mark as Pending"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleEdit(expense)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => confirmDelete(expense.id, expense.description)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {expense.notes && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2 mt-3 ml-28">
            {expense.notes}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Tracking</h1>
              <p className="text-gray-600 mt-1">Manage company expenses, reimbursements, and employee benefits</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white/60 backdrop-blur-md focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-sm font-medium"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md rounded-xl p-1 border border-white/40">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditExpense(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FiFilter className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Expense Type */}
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            >
              <option value="">All Types</option>
              {Object.entries(expenseTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            >
              <option value="">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>

            {/* Employee */}
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value || null)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            >
              <option value="">All Employees</option>
              {userOptions.map((option: any) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
            />
          </div>

          {(selectedType || selectedCategory || selectedEmployee || selectedStatus || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedType(null);
                setSelectedCategory(null);
                setSelectedEmployee(null);
                setSelectedStatus(null);
                setStartDate('');
                setEndDate('');
              }}
              className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Expense Display */}
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((expense: any) => {
              const typeConfig = expenseTypeConfig[expense.expenseType as keyof typeof expenseTypeConfig];
              const catConfig = categoryConfig[expense.category as keyof typeof categoryConfig];
              const statConfig = statusConfig[expense.reimbursementStatus as keyof typeof statusConfig];

              return (
                <div
                  key={expense.id}
                  className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${typeConfig.color} text-white mb-2`}>
                        {typeConfig.label}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{expense.description}</h3>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'PENDING' && (
                        <button
                          onClick={() => confirmApprove(expense.id, expense.description)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'APPROVED' && (
                        <button
                          onClick={() => confirmMarkPaid(expense.id, expense.description)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as Paid"
                        >
                          <FiDollarSign className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {expense.expenseType === 'REIMBURSEMENT' && (expense.reimbursementStatus === 'APPROVED' || expense.reimbursementStatus === 'PAID') && (
                        <button
                          onClick={() => confirmMarkPending(expense.id, expense.description)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Mark as Pending"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(expense.id, expense.description)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-black text-gray-900">
                      {expense.currency} {expense.amount.toLocaleString()}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statConfig.bgColor} ${statConfig.color} ${statConfig.borderColor} border`}>
                      {statConfig.label}
                    </span>
                  </div>

                  {/* Category & Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <span>{catConfig.icon} {catConfig.label}</span>
                    <span>•</span>
                    <span>{new Date(expense.expenseDate * 1000).toLocaleDateString()}</span>
                  </div>

                  {/* Employee */}
                  {expense.relatedEmployee && (
                    <div className="text-xs text-gray-600 mb-2">
                      👤 {expense.relatedEmployee.name}
                    </div>
                  )}

                  {/* Vendor */}
                  {expense.vendor && (
                    <div className="text-xs text-gray-600 mb-2">
                      🏪 {expense.vendor}
                    </div>
                  )}

                  {/* Receipt/Invoice */}
                  {expense.receiptUrl && (
                    <div className="text-xs text-violet-600 mb-2 flex items-center gap-1">
                      {expense.receiptUrl.endsWith('.pdf') ? (
                        <FiFileText className="w-3 h-3" />
                      ) : (
                        <FiImage className="w-3 h-3" />
                      )}
                      <a href={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `http://localhost:3000${expense.receiptUrl}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Receipt
                      </a>
                    </div>
                  )}

                  {/* Notes */}
                  {expense.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">
                      {expense.notes}
                    </div>
                  )}
                </div>
              );
            })}

            {expenses.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FiDollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No expenses found</p>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-6 overflow-x-auto">
            {/* Today Section */}
            {todayExpenses.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Today</h2>
                <div className="space-y-2">
                  {todayExpenses.map(renderExpenseRow)}
                </div>
              </div>
            )}

            {/* Yesterday Section */}
            {yesterdayExpenses.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Yesterday</h2>
                <div className="space-y-2">
                  {yesterdayExpenses.map(renderExpenseRow)}
                </div>
              </div>
            )}

            {/* Older Section */}
            {olderExpenses.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Older</h2>
                <div className="space-y-2">
                  {olderExpenses.map(renderExpenseRow)}
                </div>
              </div>
            )}

            {expenses.length === 0 && !expensesLoading && (
              <div className="text-center py-12 text-gray-500">
                <FiDollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No expenses found</p>
              </div>
            )}

            {/* Loading indicator */}
            {expensesLoading && expenses.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <p className="text-gray-600 mt-4">Loading expenses...</p>
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600"></div>
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !actionLoading && setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmAction.type === 'approve' && 'Approve Expense?'}
                {confirmAction.type === 'paid' && 'Mark as Paid?'}
                {confirmAction.type === 'pending' && 'Mark as Pending?'}
                {confirmAction.type === 'delete' && 'Delete Expense?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {confirmAction.type === 'approve' && `Are you sure you want to approve "${confirmAction.title}"?`}
                {confirmAction.type === 'paid' && `Are you sure you want to mark "${confirmAction.title}" as paid?`}
                {confirmAction.type === 'pending' && `Are you sure you want to mark "${confirmAction.title}" as pending?`}
                {confirmAction.type === 'delete' && `Are you sure you want to delete "${confirmAction.title}"? This action cannot be undone.`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 rounded-xl transition-all font-medium text-white disabled:opacity-50 ${
                    confirmAction.type === 'delete'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : confirmAction.type === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                      : confirmAction.type === 'pending'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {confirmAction.type === 'approve' && 'Approve'}
                      {confirmAction.type === 'paid' && 'Mark Paid'}
                      {confirmAction.type === 'pending' && 'Mark Pending'}
                      {confirmAction.type === 'delete' && 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Expense Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expense Type *</label>
                  <select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                  >
                    {Object.entries(expenseTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.icon} {config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expense Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                  />
                </div>

                {/* Related Employee (for reimbursement/benefit) */}
                {(formData.expenseType === 'REIMBURSEMENT' || formData.expenseType === 'EMPLOYEE_BENEFIT') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee {formData.expenseType === 'REIMBURSEMENT' ? '(Reimburse To)' : '(Benefit To)'}
                    </label>
                    <select
                      value={formData.relatedEmployeeId}
                      onChange={(e) => setFormData({ ...formData, relatedEmployeeId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                    >
                      <option value="">Select employee...</option>
                      {userOptions.map((option: any) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                    placeholder="Enter vendor name"
                  />
                </div>

                {/* Invoice Number & File Upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                      placeholder="INV-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt/Invoice</label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-violet-500 transition-all cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <FiUpload className="w-4 h-4" />
                      {uploadingFile ? 'Uploading...' : formData.receiptUrl ? 'Change File' : 'Upload File'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Receipt URL Preview */}
                {formData.receiptUrl && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <FiCheck className="w-3 h-3" />
                    File uploaded successfully
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none resize-none"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    {editExpense ? 'Update' : 'Create'} Expense
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { FiArrowLeft, FiPlus, FiX, FiDollarSign, FiEdit2, FiTrash2, FiFilter, FiCheck } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_USERS_QUERY } from '../graphql/admin.queries';
import {
  EXPENSES_QUERY,
  CREATE_EXPENSE_MUTATION,
  UPDATE_EXPENSE_MUTATION,
  DELETE_EXPENSE_MUTATION,
  APPROVE_EXPENSE_MUTATION,
  MARK_EXPENSE_AS_PAID_MUTATION,
} from '../graphql/expenses.mutations';

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
  MEALS_ENTERTAINMENT: { label: 'Meals & Entertainment', icon: '🍽️' },
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  const { data: expensesData, refetch: refetchExpenses } = useQuery(EXPENSES_QUERY, {
    variables: { filters: Object.keys(filters).length > 0 ? filters : undefined },
  });

  const [createExpense] = useMutation(CREATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense created successfully', { duration: 3000 });
      setShowCreateModal(false);
      resetForm();
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [updateExpense] = useMutation(UPDATE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense updated successfully', { duration: 3000 });
      setShowCreateModal(false);
      setEditExpense(null);
      resetForm();
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [deleteExpense] = useMutation(DELETE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense deleted successfully');
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [approveExpense] = useMutation(APPROVE_EXPENSE_MUTATION, {
    onCompleted: () => {
      toast.success('Expense approved');
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
  });

  const [markAsPaid] = useMutation(MARK_EXPENSE_AS_PAID_MUTATION, {
    onCompleted: () => {
      toast.success('Marked as paid');
      refetchExpenses();
    },
    onError: (error) => toast.error(error.message),
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

    if (editExpense) {
      updateExpense({ variables: { id: editExpense.id, input } });
    } else {
      // Use a mock admin user ID - in production, get from auth context
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense({ variables: { id } });
    }
  };

  const handleApprove = (id: string) => {
    // Use mock admin user ID
    approveExpense({ variables: { id, approvedById: usersData?.adminUsers[0]?.id || '123' } });
  };

  const handleMarkPaid = (id: string) => {
    markAsPaid({ variables: { id } });
  };

  const expenses = expensesData?.expenses || [];

  const userOptions = usersData?.adminUsers?.map((user: any) => ({
    value: user.id,
    label: user.name,
  })) || [];

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

        {/* Expense List */}
        <div className="grid grid-cols-1 gap-4">
          {expenses.map((expense: any) => {
            const typeConfig = expenseTypeConfig[expense.expenseType as keyof typeof expenseTypeConfig];
            const catConfig = categoryConfig[expense.category as keyof typeof categoryConfig];
            const statConfig = statusConfig[expense.reimbursementStatus as keyof typeof statusConfig];

            return (
              <div
                key={expense.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${typeConfig.color} text-white`}>
                        {typeConfig.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {catConfig.icon} {catConfig.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statConfig.bgColor} ${statConfig.color} ${statConfig.borderColor} border`}>
                        {statConfig.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{expense.description}</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <div className="font-bold text-gray-900">
                          {expense.currency} {expense.amount.toLocaleString()}
                        </div>
                      </div>

                      {expense.relatedEmployee && (
                        <div>
                          <span className="text-gray-500">Employee:</span>
                          <div className="font-medium text-gray-900">{expense.relatedEmployee.name}</div>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500">Date:</span>
                        <div className="font-medium text-gray-900">
                          {new Date(expense.expenseDate * 1000).toLocaleDateString()}
                        </div>
                      </div>

                      {expense.vendor && (
                        <div>
                          <span className="text-gray-500">Vendor:</span>
                          <div className="font-medium text-gray-900">{expense.vendor}</div>
                        </div>
                      )}
                    </div>

                    {expense.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {expense.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(expense.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                    {expense.expenseType === 'REIMBURSEMENT' && expense.reimbursementStatus === 'APPROVED' && (
                      <button
                        onClick={() => handleMarkPaid(expense.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as Paid"
                      >
                        <FiDollarSign className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {expenses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FiDollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No expenses found</p>
            </div>
          )}
        </div>
      </div>

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

                {/* Invoice Number & Receipt URL */}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt URL</label>
                    <input
                      type="url"
                      value={formData.receiptUrl}
                      onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

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

import { gql } from '@apollo/client';

export const EXPENSES_QUERY = gql`
  query Expenses($filters: ExpenseFiltersInput) {
    expenses(filters: $filters) {
      id
      expenseType
      category
      amount
      currency
      description
      expenseDate
      relatedEmployeeId
      relatedEmployee {
        id
        name
        email
      }
      reimbursementStatus
      reimbursedDate
      receiptUrl
      invoiceNumber
      vendor
      approvedById
      approvedBy {
        id
        name
      }
      approvedDate
      notes
      createdById
      createdBy {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const PAGINATED_EXPENSES_QUERY = gql`
  query PaginatedExpenses($filters: ExpenseFiltersInput) {
    paginatedExpenses(filters: $filters) {
      expenses {
        id
        expenseType
        category
        amount
        currency
        description
        expenseDate
        relatedEmployeeId
        relatedEmployee {
          id
          name
          email
        }
        reimbursementStatus
        reimbursedDate
        receiptUrl
        invoiceNumber
        vendor
        approvedById
        approvedBy {
          id
          name
        }
        approvedDate
        notes
        createdById
        createdBy {
          id
          name
        }
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`;

export const CREATE_EXPENSE_MUTATION = gql`
  mutation CreateExpense($input: CreateExpenseInput!, $createdById: ID!) {
    createExpense(input: $input, createdById: $createdById) {
      id
      expenseType
      category
      amount
      currency
      description
      expenseDate
      relatedEmployeeId
      relatedEmployee {
        id
        name
      }
      reimbursementStatus
      notes
    }
  }
`;

export const UPDATE_EXPENSE_MUTATION = gql`
  mutation UpdateExpense($id: ID!, $input: UpdateExpenseInput!) {
    updateExpense(id: $id, input: $input) {
      id
      expenseType
      category
      amount
      currency
      description
      expenseDate
      relatedEmployeeId
      relatedEmployee {
        id
        name
      }
      reimbursementStatus
      reimbursedDate
      receiptUrl
      invoiceNumber
      vendor
      notes
    }
  }
`;

export const DELETE_EXPENSE_MUTATION = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id) {
      id
    }
  }
`;

export const APPROVE_EXPENSE_MUTATION = gql`
  mutation ApproveExpense($id: ID!, $approvedById: ID!) {
    approveExpense(id: $id, approvedById: $approvedById) {
      id
      reimbursementStatus
      approvedById
      approvedBy {
        id
        name
      }
      approvedDate
    }
  }
`;

export const MARK_EXPENSE_AS_PAID_MUTATION = gql`
  mutation MarkExpenseAsPaid($id: ID!) {
    markExpenseAsPaid(id: $id) {
      id
      reimbursementStatus
      reimbursedDate
    }
  }
`;

export const MARK_EXPENSE_AS_PENDING_MUTATION = gql`
  mutation MarkExpenseAsPending($id: ID!) {
    markExpenseAsPending(id: $id) {
      id
      reimbursementStatus
    }
  }
`;

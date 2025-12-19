import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Expense } from '../generated-nestjs-typegraphql';
import { CreateExpenseInput } from './dto/create-expense.input';
import { UpdateExpenseInput } from './dto/update-expense.input';
import { ExpenseFiltersInput } from './dto/expense-filters.input';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async createExpense(
    input: CreateExpenseInput,
    createdById: string,
  ): Promise<Expense> {
    const expense = await this.prisma.expense.create({
      data: {
        ...input,
        createdById,
        reimbursementStatus: input.reimbursementStatus ||
          (input.expenseType === 'REIMBURSEMENT' ? 'PENDING' : 'NOT_APPLICABLE'),
      },
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    return expense as Expense;
  }

  async updateExpense(
    id: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    const expense = await this.prisma.expense.update({
      where: { id },
      data: input,
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    return expense as Expense;
  }

  async deleteExpense(id: string): Promise<Expense> {
    const expense = await this.prisma.expense.delete({
      where: { id },
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    return expense as Expense;
  }

  async getExpenses(filters?: ExpenseFiltersInput): Promise<Expense[]> {
    const where: any = {};

    if (filters) {
      if (filters.expenseType) {
        where.expenseType = filters.expenseType;
      }
      if (filters.category) {
        where.category = filters.category;
      }
      if (filters.reimbursementStatus) {
        where.reimbursementStatus = filters.reimbursementStatus;
      }
      if (filters.relatedEmployeeId) {
        where.relatedEmployeeId = filters.relatedEmployeeId;
      }
      if (filters.startDate || filters.endDate) {
        where.expenseDate = {};
        if (filters.startDate) {
          where.expenseDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.expenseDate.lte = filters.endDate;
        }
      }
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return expenses as Expense[];
  }

  async getExpenseById(id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return expense as Expense;
  }

  async approveExpense(
    id: string,
    approvedById: string,
  ): Promise<Expense> {
    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        approvedById,
        approvedDate: Math.floor(Date.now() / 1000),
        reimbursementStatus: 'APPROVED',
      },
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    return expense as Expense;
  }

  async markAsPaid(id: string): Promise<Expense> {
    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        reimbursementStatus: 'PAID',
        reimbursedDate: Math.floor(Date.now() / 1000),
      },
      include: {
        relatedEmployee: true,
        approvedBy: true,
        createdBy: true,
      },
    });

    return expense as Expense;
  }
}

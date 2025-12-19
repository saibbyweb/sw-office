import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';
import { Expense } from '../generated-nestjs-typegraphql';
import { CreateExpenseInput } from './dto/create-expense.input';
import { UpdateExpenseInput } from './dto/update-expense.input';
import { ExpenseFiltersInput } from './dto/expense-filters.input';

@Resolver(() => Expense)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Query(() => [Expense])
  async expenses(
    @Args('filters', { nullable: true }) filters?: ExpenseFiltersInput,
  ): Promise<Expense[]> {
    return this.expensesService.getExpenses(filters);
  }

  @Query(() => Expense)
  async expense(@Args('id', { type: () => ID }) id: string): Promise<Expense> {
    return this.expensesService.getExpenseById(id);
  }

  @Mutation(() => Expense)
  async createExpense(
    @Args('input') input: CreateExpenseInput,
    @Args('createdById', { type: () => ID }) createdById: string,
  ): Promise<Expense> {
    return this.expensesService.createExpense(input, createdById);
  }

  @Mutation(() => Expense)
  async updateExpense(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateExpenseInput,
  ): Promise<Expense> {
    return this.expensesService.updateExpense(id, input);
  }

  @Mutation(() => Expense)
  async deleteExpense(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Expense> {
    return this.expensesService.deleteExpense(id);
  }

  @Mutation(() => Expense)
  async approveExpense(
    @Args('id', { type: () => ID }) id: string,
    @Args('approvedById', { type: () => ID }) approvedById: string,
  ): Promise<Expense> {
    return this.expensesService.approveExpense(id, approvedById);
  }

  @Mutation(() => Expense)
  async markExpenseAsPaid(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Expense> {
    return this.expensesService.markAsPaid(id);
  }
}

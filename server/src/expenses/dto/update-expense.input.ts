import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import { ExpenseType, ExpenseCategory, ReimbursementStatus } from '../../generated-nestjs-typegraphql';

@InputType()
export class UpdateExpenseInput {
  @Field(() => ExpenseType, { nullable: true })
  expenseType?: ExpenseType;

  @Field(() => ExpenseCategory, { nullable: true })
  category?: ExpenseCategory;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  expenseDate?: number;

  @Field(() => ID, { nullable: true })
  relatedEmployeeId?: string;

  @Field(() => ReimbursementStatus, { nullable: true })
  reimbursementStatus?: ReimbursementStatus;

  @Field(() => Int, { nullable: true })
  reimbursedDate?: number;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field({ nullable: true })
  invoiceNumber?: string;

  @Field({ nullable: true })
  vendor?: string;

  @Field({ nullable: true })
  notes?: string;
}

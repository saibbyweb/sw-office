import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import { ExpenseType, ExpenseCategory, ReimbursementStatus } from '../../generated-nestjs-typegraphql';

@InputType()
export class CreateExpenseInput {
  @Field(() => ExpenseType)
  expenseType: ExpenseType;

  @Field(() => ExpenseCategory)
  category: ExpenseCategory;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  currency?: string;

  @Field()
  description: string;

  @Field(() => Int)
  expenseDate: number; // Epoch seconds

  @Field(() => ID, { nullable: true })
  relatedEmployeeId?: string;

  @Field(() => ReimbursementStatus, { nullable: true })
  reimbursementStatus?: ReimbursementStatus;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field({ nullable: true })
  invoiceNumber?: string;

  @Field({ nullable: true })
  vendor?: string;

  @Field({ nullable: true })
  notes?: string;
}

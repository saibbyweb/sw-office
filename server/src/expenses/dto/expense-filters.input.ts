import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { ExpenseType, ExpenseCategory, ReimbursementStatus } from '../../generated-nestjs-typegraphql';

@InputType()
export class ExpenseFiltersInput {
  @Field(() => ExpenseType, { nullable: true })
  expenseType?: ExpenseType;

  @Field(() => ExpenseCategory, { nullable: true })
  category?: ExpenseCategory;

  @Field(() => ReimbursementStatus, { nullable: true })
  reimbursementStatus?: ReimbursementStatus;

  @Field(() => ID, { nullable: true })
  relatedEmployeeId?: string;

  @Field(() => Int, { nullable: true })
  startDate?: number; // Epoch seconds

  @Field(() => Int, { nullable: true })
  endDate?: number; // Epoch seconds

  @Field(() => Int, { nullable: true })
  skip?: number; // Number of records to skip

  @Field(() => Int, { nullable: true })
  take?: number; // Number of records to take
}

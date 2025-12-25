import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Expense } from '../../generated-nestjs-typegraphql';

@ObjectType()
export class PaginatedExpensesResponse {
  @Field(() => [Expense])
  expenses: Expense[];

  @Field(() => Int)
  total: number;

  @Field(() => Boolean)
  hasMore: boolean;
}

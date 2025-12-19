import { Module } from '@nestjs/common';
import { ExpensesResolver } from './expenses.resolver';
import { ExpensesService } from './expenses.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ExpensesResolver, ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

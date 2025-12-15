import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkExceptionTimeMigrationService implements OnModuleInit {
  private readonly logger = new Logger(WorkExceptionTimeMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.migrateTimesToEpoch();
  }

  async migrateTimesToEpoch(): Promise<void> {
    this.logger.log('Starting work exception time migration to epoch...');

    try {
      // Find all work exceptions that have scheduledTime or actualTime but not the epoch versions
      const exceptions = await this.prisma.workException.findMany({
        where: {
          OR: [
            {
              AND: [
                { scheduledTime: { isSet: true } },
                { scheduledTimeEpoch: { isSet: false } },
              ],
            },
            {
              AND: [
                { actualTime: { isSet: true } },
                { actualTimeEpoch: { isSet: false } },
              ],
            },
          ],
        },
      });

      this.logger.log(`Found ${exceptions.length} work exceptions to migrate`);

      let migratedCount = 0;

      for (const exception of exceptions) {
        const updateData: any = {};

        if (exception.scheduledTime && !exception.scheduledTimeEpoch) {
          updateData.scheduledTimeEpoch = Math.floor(
            new Date(exception.scheduledTime).getTime() / 1000,
          );
        }

        if (exception.actualTime && !exception.actualTimeEpoch) {
          updateData.actualTimeEpoch = Math.floor(
            new Date(exception.actualTime).getTime() / 1000,
          );
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.workException.update({
            where: { id: exception.id },
            data: updateData,
          });
          migratedCount++;
        }
      }

      this.logger.log(
        `Successfully migrated ${migratedCount} work exception time fields to epoch`,
      );
    } catch (error) {
      this.logger.error('Error during work exception time migration:', error);
      throw error;
    }
  }
}

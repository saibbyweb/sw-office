import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * MongoDB Backup Script
 *
 * Creates a JSON backup of all collections in MongoDB
 * Usage: npm run backup
 */

async function backupMongoDB() {
  console.log('🔄 Starting MongoDB backup...\n');

  // Create backup directory with timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  const backupDir = path.join(process.cwd(), 'backups', timestamp);

  // Create directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`📁 Backup directory: ${backupDir}\n`);

  try {
    // Backup users
    console.log('📊 Backing up users...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${users.length} records`);

    // Backup tasks
    console.log('📊 Backing up tasks...');
    const tasks = await prisma.task.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'tasks.json'),
      JSON.stringify(tasks, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${tasks.length} records`);

    // Backup projects
    console.log('📊 Backing up projects...');
    const projects = await prisma.project.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'projects.json'),
      JSON.stringify(projects, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${projects.length} records`);

    // Backup sessions
    console.log('📊 Backing up sessions...');
    const sessions = await prisma.session.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'sessions.json'),
      JSON.stringify(sessions, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${sessions.length} records`);

    // Backup breaks
    console.log('📊 Backing up breaks...');
    const breaks = await prisma.break.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'breaks.json'),
      JSON.stringify(breaks, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${breaks.length} records`);

    // Backup worklogs
    console.log('📊 Backing up worklogs...');
    const worklogs = await prisma.workLog.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'worklogs.json'),
      JSON.stringify(worklogs, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${worklogs.length} records`);

    // Backup segments
    console.log('📊 Backing up segments...');
    const segments = await prisma.segment.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'segments.json'),
      JSON.stringify(segments, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${segments.length} records`);

    // Backup work exceptions
    console.log('📊 Backing up work_exceptions...');
    const workExceptions = await prisma.workException.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'work_exceptions.json'),
      JSON.stringify(workExceptions, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${workExceptions.length} records`);

    // Backup daily output scores
    console.log('📊 Backing up daily_output_scores...');
    const dailyScores = await prisma.dailyOutputScore.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'daily_output_scores.json'),
      JSON.stringify(dailyScores, null, 2),
      'utf-8'
    );
    console.log(`   ✅ Saved ${dailyScores.length} records`);

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      backupDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      collections: [
        'users',
        'tasks',
        'projects',
        'sessions',
        'breaks',
        'worklogs',
        'segments',
        'work_exceptions',
        'daily_output_scores'
      ],
      totalRecords: {
        users: users.length,
        tasks: tasks.length,
        projects: projects.length,
        sessions: sessions.length,
        breaks: breaks.length,
        worklogs: worklogs.length,
        segments: segments.length,
        work_exceptions: workExceptions.length,
        daily_output_scores: dailyScores.length,
      },
      nodeVersion: process.version,
    };

    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Location: ${backupDir}`);
    console.log(`📊 Total collections: ${metadata.collections.length}`);
    console.log(`📄 Total records: ${Object.values(metadata.totalRecords).reduce((a, b) => a + b, 0)}`);
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupMongoDB()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

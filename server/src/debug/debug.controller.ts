import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DebugService } from './debug.service';
import {
  Session,
  Break,
  Segment,
  WorkLog,
} from '../generated-nestjs-typegraphql';

interface DebugData {
  activeSessions: Session[];
  activeBreaks: Break[];
  recentSegments: Segment[];
  recentWorkLogs: WorkLog[];
}

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

@Controller('debug')
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Get()
  async renderDebugPage(@Res() res: Response) {
    const data: DebugData = await this.debugService.getDebugData();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>System Debug</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 2rem;
              max-width: 1200px;
              margin: 0 auto;
              background: #f5f5f5;
            }
            h1, h2 {
              color: #333;
            }
            .section {
              background: white;
              padding: 1.5rem;
              border-radius: 8px;
              margin-bottom: 1.5rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 1rem;
            }
            th, td {
              text-align: left;
              padding: 0.75rem;
              border-bottom: 1px solid #eee;
            }
            th {
              background: #f8f8f8;
              font-weight: 600;
            }
            .status {
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-size: 0.875rem;
            }
            .status-active {
              background: #e6f4ea;
              color: #137333;
            }
            .status-completed {
              background: #e8eaed;
              color: #3c4043;
            }
            .refresh {
              position: fixed;
              top: 1rem;
              right: 1rem;
              padding: 0.5rem 1rem;
              background: #1a73e8;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 0.875rem;
            }
            .refresh:hover {
              background: #1557b0;
            }
            .meta {
              color: #666;
              font-size: 0.875rem;
            }
            .duration {
              font-family: monospace;
              font-size: 0.875rem;
            }
            .break-type {
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-size: 0.875rem;
              background: #fef7e0;
              color: #b06000;
            }
          </style>
        </head>
        <body>
          <a href="/debug" class="refresh">Refresh Data</a>
          <h1>System Debug</h1>
          <p class="meta">Last updated: ${new Date().toLocaleString()}</p>

          <div class="section">
            <h2>Active Sessions (${data.activeSessions.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Project</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Break Time</th>
                  <th>Active Time</th>
                </tr>
              </thead>
              <tbody>
                ${data.activeSessions
                  .map((session) => {
                    const activeTime =
                      session.totalDuration - session.totalBreakTime;
                    return `
                        <tr>
                          <td>${session.id}</td>
                          <td>${session.user?.name || 'Unknown'}</td>
                          <td>${session.project?.name || 'No Project'}</td>
                          <td>${new Date(session.startTime).toLocaleString()}</td>
                          <td class="duration">${formatDuration(session.totalDuration)}</td>
                          <td class="duration">${formatDuration(session.totalBreakTime)}</td>
                          <td class="duration">${formatDuration(activeTime)}</td>
                        </tr>
                      `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Active Breaks (${data.activeBreaks.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Start Time</th>
                  <th>Duration</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                ${data.activeBreaks
                  .map((break_) => {
                    const duration = Math.floor(
                      (Date.now() - new Date(break_.startTime).getTime()) /
                        1000,
                    );
                    return `
                        <tr>
                          <td>${break_.id}</td>
                          <td>${break_.user?.name || 'Unknown'}</td>
                          <td><span class="break-type">${break_.type}</span></td>
                          <td>${new Date(break_.startTime).toLocaleString()}</td>
                          <td class="duration">${formatDuration(duration)}</td>
                          <td>${break_.sessionId}</td>
                        </tr>
                      `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Recent Segments (${data.recentSegments.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Project</th>
                  <th>Break Type</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                ${data.recentSegments
                  .map((segment) => {
                    const duration = segment.endTime
                      ? Math.floor(
                          (new Date(segment.endTime).getTime() -
                            new Date(segment.startTime).getTime()) /
                            1000,
                        )
                      : Math.floor(
                          (Date.now() - new Date(segment.startTime).getTime()) /
                            1000,
                        );
                    return `
                        <tr>
                          <td>${segment.id}</td>
                          <td>${segment.type}</td>
                          <td>${new Date(segment.startTime).toLocaleString()}</td>
                          <td>${segment.endTime ? new Date(segment.endTime).toLocaleString() : 'Active'}</td>
                          <td class="duration">${formatDuration(duration)}</td>
                          <td>${segment.project?.name || '-'}</td>
                          <td>${segment.break?.type || '-'}</td>
                          <td>${segment.sessionId}</td>
                        </tr>
                      `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Recent Work Logs (${data.recentWorkLogs.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Project</th>
                  <th>Content</th>
                  <th>Created At</th>
                  <th>Session</th>
                </tr>
              </thead>
              <tbody>
                ${data.recentWorkLogs
                  .map(
                    (log) => `
                      <tr>
                        <td>${log.id}</td>
                        <td>${log.user?.name || 'Unknown'}</td>
                        <td>${log.project?.name || 'Unknown Project'}</td>
                        <td>${log.content}</td>
                        <td>${new Date(log.createdAt).toLocaleString()}</td>
                        <td>${log.session?.id || 'Unknown Session'}</td>
                      </tr>
                    `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    res.send(html);
  }
}

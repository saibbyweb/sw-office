import { Controller, Get, Param, Render } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('sessions')
  @Render('admin/sessions')
  async getUserSessions() {
    const sessions = await this.adminService.getAllActiveSessions();

    return { sessions };
  }

  @Get('sessions/:userId')
  @Render('admin/session-detail')
  async getUserSessionDetail(@Param('userId') userId: string) {
    const sessionDetail = await this.adminService.getUserSessionDetail(userId);

    return { sessionDetail };
  }
}

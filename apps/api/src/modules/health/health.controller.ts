import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; service: 'boke-api'; timestamp: string } {
    return {
      status: 'ok',
      service: 'boke-api',
      timestamp: new Date().toISOString(),
    };
  }
}
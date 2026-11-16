import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { HrmController } from './hrm.controller';
import { HrmService } from './hrm.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [HrmController],
  providers: [HrmService],
  exports: [HrmService],
})
export class HrmModule {}

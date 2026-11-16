import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import { HardwareAdapterService } from './hardware-adapter.service';
import { BiometricSecurityService } from './biometric-security.service';

@Module({
  controllers: [AccessControlController],
  providers: [
    AccessControlService,
    HardwareAdapterService,
    BiometricSecurityService,
  ],
  exports: [
    AccessControlService,
    HardwareAdapterService,
    BiometricSecurityService,
  ],
})
export class AccessControlModule {}


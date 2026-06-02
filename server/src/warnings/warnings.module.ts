import { Module } from '@nestjs/common';
import { WarningEngineService } from './warning-engine.service';

@Module({
  providers: [WarningEngineService],
  exports: [WarningEngineService],
})
export class WarningsModule {}
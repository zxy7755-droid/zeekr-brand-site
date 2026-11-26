import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { StoresModule } from './stores/stores.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [VehiclesModule, StoresModule],
  controllers: [HealthController],
})
export class AppModule {}

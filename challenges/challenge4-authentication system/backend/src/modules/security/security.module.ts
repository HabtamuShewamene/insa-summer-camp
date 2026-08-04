import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { BruteForceService } from './brute-force.service';

@Module({
  providers: [SecurityService, BruteForceService],
  exports: [SecurityService, BruteForceService],
})
export class SecurityModule {}

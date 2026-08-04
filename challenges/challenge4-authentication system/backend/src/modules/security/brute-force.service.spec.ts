import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BruteForceService } from './brute-force.service';
import { SecurityService } from './security.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('BruteForceService', () => {
  let service: BruteForceService;
  let prisma: jest.Mocked<PrismaService>;

  
  beforeEach(async () => {
    const mockPrisma = {
      loginAttempt: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const mockSecurity = {
      createSecurityEvent: jest.fn(),
      recordLoginHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BruteForceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SecurityService, useValue: mockSecurity },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, number> = {
                MAX_LOGIN_ATTEMPTS: 5,
                LOCKOUT_DURATION_MINUTES: 15,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BruteForceService>(BruteForceService);
    prisma = module.get(PrismaService);
  });

  describe('isBlocked', () => {
    it('should return false when no attempt record exists', async () => {
      (prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.isBlocked('test@example.com', '127.0.0.1');
      expect(result).toBe(false);
    });

    it('should return true when blocked_until is in the future', async () => {
      (prisma.loginAttempt.findUnique as jest.Mock).mockResolvedValue({
        blockedUntil: new Date(Date.now() + 60000),
      });
      const result = await service.isBlocked('test@example.com', '127.0.0.1');
      expect(result).toBe(true);
    });
  });
});

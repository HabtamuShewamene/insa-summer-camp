import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  describe('validatePassword', () => {
    it('should accept a strong password', () => {
      expect(() => service.validatePassword('Ich@2026Secure')).not.toThrow();
    });

    it('should reject short passwords', () => {
      expect(() => service.validatePassword('Ab1!')).toThrow(BadRequestException);
    });

    it('should reject passwords without uppercase', () => {
      expect(() => service.validatePassword('ich@2026secure')).toThrow(
        BadRequestException,
      );
    });

    it('should reject common weak passwords', () => {
      expect(() => service.validatePassword('Password1!')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'Ich@2026Secure';
      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2id$')).toBe(true);

      const valid = await service.verifyPassword(password, hash);
      expect(valid).toBe(true);

      const invalid = await service.verifyPassword('WrongPass1!', hash);
      expect(invalid).toBe(false);
    });
  });
});

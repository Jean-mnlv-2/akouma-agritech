import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

export type AuthJwtPayload = {
  sub: string;
  role: string;
};

export type AuthUserSafe = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
};

export class AuthService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  private signToken(payload: AuthJwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  private toSafeUser(user: User): AuthUserSafe {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async signInWithEmail(email: string, password: string): Promise<{ token: string; user: AuthUserSafe }> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new Error('invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new Error('invalid credentials');
    }
    if (!user.isActive) {
      throw new Error('account disabled');
    }
    const token = this.signToken({ sub: user.id, role: user.role });
    return { token, user: this.toSafeUser(user) };
  }

  async signUpWithEmail(email: string, password: string, fullName?: string | null): Promise<{ token: string; user: AuthUserSafe }> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new Error('email already used');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const safeFullName = typeof fullName === 'string' && fullName.trim().length > 0 ? fullName.trim() : null;
    const created = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: safeFullName,
        role: 'customer',
        isActive: true,
      },
    });
    const token = this.signToken({ sub: created.id, role: created.role });
    return { token, user: this.toSafeUser(created) };
  }

  async getUserFromToken(token: string): Promise<AuthUserSafe | null> {
    let decoded: AuthJwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
    } catch {
      return null;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}


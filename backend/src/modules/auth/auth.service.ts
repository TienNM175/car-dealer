import prisma from '../../config/database';
import { PasswordUtil } from '../../utils/password.util';
import { JwtUtil, JwtPayload } from '../../utils/jwt.util';
import { UserRole } from '@prisma/client';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  dealerId?: string;
} 

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password
    const passwordValidation = PasswordUtil.validate(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || 'DEALER_STAFF',
        dealerId: data.dealerId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        dealerId: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      dealerId: user.dealerId || undefined,
    };

    const tokens = JwtUtil.generateTokenPair(payload);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: tokens.accessToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      tokens,
    };
  }

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(
      data.password,
      user.hashedPassword
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      dealerId: user.dealerId || undefined,
    };

    const tokens = JwtUtil.generateTokenPair(payload);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: tokens.accessToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Remove sensitive data
    const { hashedPassword, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async logout(sessionToken: string) {
    await prisma.session.updateMany({
      where: { sessionToken, isActive: true },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newTokens = JwtUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        dealerId: user.dealerId || undefined,
      });

      return newTokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dealerId: true,
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            regionId: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
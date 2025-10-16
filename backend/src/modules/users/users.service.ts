import prisma from '../../config/database';
import { PasswordUtil } from '../../utils/password.util';
import { UserRole } from '@prisma/client';

interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  dealerId?: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  dealerId?: string;
  isActive?: boolean;
}

interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  dealerId?: string;
  isActive?: boolean;
}

export class UsersService {
  /**
   * Create new user (Admin/Dealer Manager only)
   */
  async createUser(data: CreateUserInput, creatorUserId: string) {
    // Get creator info
    const creator = await prisma.user.findUnique({
      where: { id: creatorUserId },
      select: { role: true, dealerId: true },
    });

    if (!creator) {
      throw new Error('Creator not found');
    }

    // Business logic validation
    this.validateUserCreation(data, creator);

    // Check if email exists
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
        role: data.role,
        dealerId: data.dealerId,
      },
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

    // Remove sensitive data
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validate user creation based on creator role
   */
  private validateUserCreation(
    data: CreateUserInput,
    creator: { role: string; dealerId: string | null }
  ) {
    // Admin can create any user
    if (creator.role === 'ADMIN') {
      // Admin creating EVM_STAFF or ADMIN should not have dealerId
      if (
        (data.role === 'ADMIN' || data.role === 'EVM_STAFF') &&
        data.dealerId
      ) {
        throw new Error('Admin and EVM Staff cannot be assigned to a dealer');
      }

      // Dealer roles must have dealerId
      if (
        (data.role === 'DEALER_MANAGER' || data.role === 'DEALER_STAFF') &&
        !data.dealerId
      ) {
        throw new Error('Dealer staff must be assigned to a dealer');
      }
      return;
    }

    // Dealer Manager can only create staff for their dealer
    if (creator.role === 'DEALER_MANAGER') {
      if (!creator.dealerId) {
        throw new Error('Dealer Manager must belong to a dealer');
      }

      // Can only create DEALER_STAFF
      if (data.role !== 'DEALER_STAFF') {
        throw new Error('Dealer Manager can only create Dealer Staff accounts');
      }

      // Must assign to same dealer
      if (data.dealerId !== creator.dealerId) {
        throw new Error('Can only create staff for your own dealer');
      }
      return;
    }

    // Other roles cannot create users
    throw new Error('You do not have permission to create users');
  }

  /**
   * List users with filters and pagination
   */
  async listUsers(query: ListUsersQuery, requestUserId: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Get requester info
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true, dealerId: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    // Build where clause based on role
    const where: any = {};

    // Search by name or email
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (query.role) {
      where.role = query.role;
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Filter by dealer
    if (query.dealerId) {
      where.dealerId = query.dealerId;
    }

    // Role-based filtering
    if (requester.role === 'DEALER_MANAGER' || requester.role === 'DEALER_STAFF') {
      // Can only see users from their dealer
      where.dealerId = requester.dealerId;
    }
    // Admin and EVM_STAFF can see all users

    // Count total
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
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
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, requestUserId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true, dealerId: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Role-based access control
    if (
      (requester.role === 'DEALER_MANAGER' || requester.role === 'DEALER_STAFF') &&
      user.dealerId !== requester.dealerId
    ) {
      throw new Error('You can only view users from your dealer');
    }

    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: UpdateUserInput,
    requestUserId: string
  ) {
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true, dealerId: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, dealerId: true },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Validate update permissions
    this.validateUserUpdate(data, requester, targetUser);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        dealerId: data.dealerId,
        isActive: data.isActive,
      },
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

    const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Validate user update permissions
   */
  private validateUserUpdate(
    data: UpdateUserInput,
    requester: { role: string; dealerId: string | null },
    targetUser: { role: string; dealerId: string | null }
  ) {
    // Admin can update anyone
    if (requester.role === 'ADMIN') {
      return;
    }

    // Dealer Manager can only update staff in their dealer
    if (requester.role === 'DEALER_MANAGER') {
      if (targetUser.dealerId !== requester.dealerId) {
        throw new Error('You can only update users from your dealer');
      }

      // Cannot change role
      if (data.role && data.role !== targetUser.role) {
        throw new Error('Dealer Manager cannot change user roles');
      }

      // Cannot change dealer
      if (data.dealerId && data.dealerId !== requester.dealerId) {
        throw new Error('Cannot assign user to different dealer');
      }

      return;
    }

    // Other roles cannot update users
    throw new Error('You do not have permission to update users');
  }

  /**
   * Delete user (soft delete by setting isActive = false)
   */
  async deleteUser(userId: string, requestUserId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true, dealerId: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { dealerId: true },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Only Admin can delete
    if (requester.role !== 'ADMIN') {
      throw new Error('Only administrators can delete users');
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Assign user to dealer
   */
  async assignToDealer(
    userId: string,
    dealerId: string,
    requestUserId: string
  ) {
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    // Only Admin can assign users to dealers
    if (requester.role !== 'ADMIN') {
      throw new Error('Only administrators can assign users to dealers');
    }

    // Verify dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    // Verify user exists and role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Admin and EVM_STAFF cannot be assigned to dealers
    if (user.role === 'ADMIN' || user.role === 'EVM_STAFF') {
      throw new Error('Admin and EVM Staff cannot be assigned to dealers');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { dealerId },
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

    const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    requestUserId: string
  ) {
    // Users can change their own password, Admin can change anyone's
    const requester = await prisma.user.findUnique({
      where: { id: requestUserId },
      select: { role: true },
    });

    if (!requester) {
      throw new Error('User not found');
    }

    if (requester.role !== 'ADMIN' && userId !== requestUserId) {
      throw new Error('You can only change your own password');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password (skip for Admin changing other user's password)
    if (userId === requestUserId) {
      const isOldPasswordValid = await PasswordUtil.compare(
        oldPassword,
        user.hashedPassword
      );

      if (!isOldPasswordValid) {
        throw new Error('Current password is incorrect');
      }
    }

    // Validate new password
    const passwordValidation = PasswordUtil.validate(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return { message: 'Password changed successfully. Please login again.' };
  }
}
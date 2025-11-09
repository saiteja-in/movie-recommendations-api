import bcrypt from 'bcryptjs';
import { User } from '../types';

export class UserModel {
  static validate(user: Partial<User>): string[] {
    const errors: string[] = [];

    if (!user.username || user.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Valid email is required');
    }

    if (!user.password || user.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return errors;
  }

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'password'> & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return {
      id: this.generateId(),
      username: userData.username,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      preferences: userData.preferences,
    };
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
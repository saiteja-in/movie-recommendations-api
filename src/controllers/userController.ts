import { Request, Response } from 'express';
import { db } from '../services/database';
import { UserModel } from '../models/User';
import { generateToken } from '../middleware/auth';
import { ApiResponse, User, AuthRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;
    const validationErrors = UserModel.validate(userData);

    if (validationErrors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: validationErrors.join(', '),
      };
      res.status(400).json(response);
      return;
    }

    const existingUser = await db.getUserByEmail(userData.email);
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User with this email already exists',
      };
      res.status(409).json(response);
      return;
    }

    const existingUsername = await db.getUserByUsername(userData.username);
    if (existingUsername) {
      const response: ApiResponse = {
        success: false,
        error: 'Username already taken',
      };
      res.status(409).json(response);
      return;
    }

    const user = await UserModel.create(userData);
    const newUser = await db.createUser(user);

    const token = generateToken(newUser.id);
    console.log("token while registering ",token)
    const userResponse = { ...newUser, password: undefined };

    const response: ApiResponse<{ user: Partial<User>; token: string }> = {
      success: true,
      data: { user: userResponse, token },
      message: 'User registered successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to register user',
    };
    res.status(500).json(response);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const response: ApiResponse = {
        success: false,
        error: 'Email and password are required',
      };
      res.status(400).json(response);
      return;
    }
    console.log(email," ",password)
    const user = await db.getUserByEmail(email);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }
    console.log("user ",user)

    const isValidPassword = await UserModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials',
      };
      res.status(401).json(response);
      return;
    }

    const token = generateToken(user.id);
    console.log("token while logging ",token)

    const userResponse = { ...user, password: undefined };

    const response: ApiResponse<{ user: Partial<User>; token: string }> = {
      success: true,
      data: { user: userResponse, token },
      message: 'Login successful',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to login',
    };
    res.status(500).json(response);
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    const userResponse = { ...user, password: undefined };
    const response: ApiResponse<Partial<User>> = {
      success: true,
      data: userResponse,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch profile',
    };
    res.status(500).json(response);
  }
};
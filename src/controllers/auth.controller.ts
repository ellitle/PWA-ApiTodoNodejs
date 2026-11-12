import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterUserRequest } from '../types/user.types';
import jwt from 'jsonwebtoken';

const authService = new AuthService();

export class AuthController {
    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
          const user  = await authService.register(req.body as RegisterUserRequest);
          res.status(201).json(user );
        } catch (error) {
          next(error);
        }
      };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) {
            res.status(500).json({ error: 'JWT secret not configured' });
            return;
          }
          const user = await authService.login(req.body);
          const token = jwt.sign({ userId: user.id }, secret, { algorithm: 'HS256', expiresIn: '1h' });

          res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
          });

          res.status(200).json({ message: 'Login successful', token });
        } catch (error) {
          res.status(500).json({ error: 'Login failed' });
        }
      };
      
    logout = (req: Request, res: Response): void => {
      res.clearCookie('authToken', {
        path: '/'
      });
    
      res.status(200).json({
        message: 'User logged out successfully'
      });
    };
}

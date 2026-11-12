import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';
import jwt from 'jsonwebtoken';

const accountService = new AccountService();

export class AccountController {
  getUserAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: 'JWT secret not configured' });
        return;
      }

      const header = req.get('Authorization');

      if (!header?.startsWith('Bearer ')) {
        throw new jwt.JsonWebTokenError('Bearer token required');
      }

      const token = header.slice(7);
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

      if (
        typeof payload === 'string' ||
        typeof payload.userId !== 'string' ||
        !payload.userId.trim() ||
        typeof payload.exp !== 'number'
      ) {
        throw new jwt.JsonWebTokenError('Invalid token');
      }

      const accounts = await accountService.getUserAccounts(payload.userId);
      res.status(200).json(accounts);
    } catch (error){
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
}

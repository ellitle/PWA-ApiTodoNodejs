import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';
import jwt from 'jsonwebtoken';

const accountService = new AccountService();

export class AccountController {
  getUserAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.JWT_KEY;
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

      // Validation fait avec l'aide de l'AI pour s'assurer que le payload contient bien un userId et un exp
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

  addFunds = async (req: Request<{ accountId: string }, {}, { amount: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const secret = process.env.JWT_KEY;
      if (!secret) {
        res.status(500).json({ error: 'Erreur avec le JWT' });
        return;
      }

      const header = req.get('Authorization');
      if (!header?.startsWith('Bearer ')) {
        throw new jwt.JsonWebTokenError('Bearer token required');
      }

      const payload = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.userId !== 'string' || !payload.userId.trim() || typeof payload.exp !== 'number') {
        throw new jwt.JsonWebTokenError('Jeton invalide');
      }
      // Validation que le montant est valide 
      const amount: unknown = req.body?.amount;
      // validation du montant fait avec l'aide de l'AI pour s'assurer que le montant est bien un string et qu'il est positif
      if (typeof amount !== 'string' || !/^(0|[1-9]\d{0,12})\.\d{2}$/.test(amount) || amount === '0.00') {
        res.status(400).json({ error: 'Le montant depose doit etre positif' });
        return;
      }

      const account = await accountService.addFunds(payload.userId, req.params.accountId, amount);
      if (!account) {
        res.status(404).json({ error: 'Compte introuvable' });
        return;
      }
      res.status(200).json(account);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Jeton invalide' });
        return;
      }
      console.error('Erreur lors du dépôt', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

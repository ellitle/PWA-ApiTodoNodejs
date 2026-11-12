import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';

export const createAccountRoutes = (): Router => {
  const accountController = new AccountController();
  const router = Router();

  router.get('/accounts', accountController.getUserAccounts);
  return router;
};

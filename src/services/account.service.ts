import { AccountRepository } from '../repositories/account.repository';
import { AccountResponse } from '../types/account.types';

export class AccountService {
  constructor(
    private readonly accountRepository: Pick<AccountRepository, 'findByUserId' | 'addFunds'> = new AccountRepository()
  ) {}

  async getUserAccounts(userId: string): Promise<AccountResponse[]> {
    return this.accountRepository.findByUserId(userId);
  }
  async addFunds(userId: string, accountId: string, amount: string): Promise<AccountResponse | null> {
    return this.accountRepository.addFunds(userId, accountId, amount);
  }
}

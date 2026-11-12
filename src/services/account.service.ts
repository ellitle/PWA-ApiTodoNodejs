import { AccountRepository } from '../repositories/account.repository';
import { AccountResponse } from '../types/account.types';

export class AccountService {
  constructor(
    private readonly accountRepository: Pick<AccountRepository, 'findByUserId'> = new AccountRepository()
  ) {}

  async getUserAccounts(userId: string): Promise<AccountResponse[]> {
    return this.accountRepository.findByUserId(userId);
  }
}

import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { account } from '../db/schema';
import { AccountResponse } from '../types/account.types';

export class AccountRepository {
  async findByUserId(userId: string): Promise<AccountResponse[]> {
    return db.select().from(account).where(eq(account.userId, userId));
  }
}

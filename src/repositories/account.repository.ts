import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { account } from '../db/schema';
import { AccountResponse } from '../types/account.types';

export class AccountRepository {
  async findByUserId(userId: string): Promise<AccountResponse[]> {
    return db.select().from(account).where(eq(account.userId, userId));
  }

  async addFunds(userId: string, accountId: string, amount: string): Promise<AccountResponse | null> {
    return db.transaction(async (tx) => {
      const clientAccount = and(
        eq(account.id, accountId),
        eq(account.userId, userId)
      );
      const [result] = await tx.update(account)
      .set({
        balance: sql`${account.balance} + CAST(${amount} AS DECIMAL(15, 2))`,
      })
      .where(clientAccount);
      if (result.affectedRows === 0) {
        return null;
      }

      const [updatedAccount] = await tx.select().from(account).where(clientAccount).limit(1);
      if (!updatedAccount) {
        throw new Error('Impossible de récupérer le compte après le dépôt');
      }
      return updatedAccount;
    });
  }
}

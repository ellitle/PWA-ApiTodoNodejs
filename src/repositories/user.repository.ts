import { eq } from 'drizzle-orm';
import { NewUser, User } from '../types/user.types';
import { users, account } from '../db/schema';
import { db } from '../db/connection';
import { randomUUID } from 'crypto';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? this.mapToUser(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? this.mapToUser(result[0]) : null;
  }

  async create(user: NewUser): Promise<User> {
    
    return db.transaction(async (tx) => {
      await tx.insert(users).values(user);
  
      await tx.insert(account).values({
        id: randomUUID(),
        userId: user.id,
      });
  
      const [createdUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
  
      if (!createdUser) {
        throw new Error('Failed to create user');
      }
  
      return this.mapToUser(createdUser);
    });
  }


  
  private mapToUser(row: any): User {
    return {
      id: row.id,
      lastName: row.lastName,
      firstName: row.firstName,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt
    };
  }
}
import { mysqlTable, varchar, timestamp, decimal } from 'drizzle-orm/mysql-core';

// On défini le schéma ici. C'est ce qui sera utilisé pour créer la table dans la base de données.
// On utilise les types de Drizzle pour définir les colonnes de la table.
// Chaque colonne est définie avec un type, une longueur (si applicable) et des contraintes

//table users
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  lastName: varchar('lastName', { length: 100 }).notNull(),
  firstName: varchar('firstName', { length: 100 }).notNull(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

//table account
export const account = mysqlTable('account', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('userId', { length: 36 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('10000.00'),
  openedAt: timestamp('openedAt').defaultNow().notNull(),
});

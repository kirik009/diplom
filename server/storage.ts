import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Инициализация окружения
dotenv.config();

// Инициализация PostgreSQL connection pool
export const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE, 
  password: process.env.PASSWORD, 
  port: Number(process.env.DB_PORT), 
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Error connecting to PostgreSQL:", err));

// Инициализация Drizzle с нашей схемой
export const db = drizzle(pool, { schema });

// Хелпер для хеширования паролей
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const storage = {
  // Операции с пользователями
  async createUser(userData: schema.InsertUser) {
    const hashedPassword = hashPassword(userData.password);
    return await db.insert(schema.users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
  },

  async getUserByUsername(username: string) {
    try {
      const users = await db.select().from(schema.users).where(eq(schema.users.username, username));
      console.log(`Found ${users.length} users with username: ${username}`);
      return users[0] || null;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  },

  
};
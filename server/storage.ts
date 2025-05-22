import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/attendance',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('Database connection configuration:', {
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/attendance',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Drizzle with our schema
const db = drizzle(pool, { schema });

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const storage = {
  // User related operations
  // Храним пользователей в памяти для демо-версии
  _mockUsers: Array<any> = [
    {
      id: 1,
      username: 'admin',
      password: 'admin',
      role: 'admin',
      firstName: 'Администратор',
      lastName: 'Системы',
      middleName: null,
      groupId: null,
      departmentId: null
    },
    {
      id: 2,
      username: 'teacher',
      password: 'teacher1',
      role: 'teacher',
      firstName: 'Петр',
      lastName: 'Преподавателев',
      middleName: null,
      groupId: null,
      departmentId: 1
    },
    {
      id: 3,
      username: 'student',
      password: 'student1',
      role: 'student',
      firstName: 'Иван',
      lastName: 'Студентов',
      middleName: null,
      groupId: 1,
      departmentId: null
    }
  ],

  async createUser(userData: schema.InsertUser) {
    try {
      console.log(`Создание пользователя: ${userData.username}`);
      
      // Проверяем, не существует ли уже пользователь с таким именем
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error('Пользователь с таким именем уже существует');
      }
      
      // Создаем нового пользователя с новым ID
      const newId = this._mockUsers.length > 0 ? 
        Math.max(...this._mockUsers.map(user => user.id)) + 1 : 1;
      
      const newUser = {
        id: newId,
        ...userData
      };
      
      // Добавляем в нашу "базу данных"
      this._mockUsers.push(newUser);
      
      console.log(`Пользователь ${userData.username} успешно создан`);
      return newUser;
    } catch (error) {
      console.error('Ошибка при создании пользователя:', error);
      throw error;
    }
  },

  async getUserByUsername(username: string): Promise<any> {
    try {
      console.log(`Looking for user with username ${username}`);
      
      // Ищем пользователя в нашем массиве
      const user = this._mockUsers.find(u => u.username === username);
      
      if (user) {
        console.log(`Пользователь ${username} найден`);
        return { ...user };
      }
      
      console.log(`Пользователь ${username} не найден`);
      return null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  },

  async getUser(id: number) {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0] || null;
  },

  async getAllUsers() {
    console.log('Получение всех пользователей');
    return [...this._mockUsers];
  },

  // Group related operations
  async getAllGroups() {
    return await db.select().from(schema.groups);
  },

  async getGroup(id: number) {
    const groups = await db.select().from(schema.groups).where(eq(schema.groups.id, id));
    return groups[0] || null;
  },

  // Class related operations
  async createClass(classData: schema.InsertClass) {
    return await db.insert(schema.classes).values(classData).returning();
  },

  async getClass(id: number) {
    const classes = await db.select().from(schema.classes).where(eq(schema.classes.id, id));
    return classes[0] || null;
  },

  async getAllClasses() {
    return await db.select().from(schema.classes);
  },

  async getClassesByTeacher(teacherId: number) {
    return await db.select().from(schema.classes).where(eq(schema.classes.teacherId, teacherId));
  },

  async getClassesByGroup(groupId: number) {
    return await db.select().from(schema.classes).where(eq(schema.classes.groupId, groupId));
  },

  async updateClass(id: number, data: Partial<schema.InsertClass>) {
    return await db.update(schema.classes).set(data).where(eq(schema.classes.id, id)).returning();
  },

  // Subject related operations
  async getAllSubjects() {
    return await db.select().from(schema.subjects);
  },

  // Attendance related operations
  async createAttendanceRecord(data: schema.InsertAttendanceRecord) {
    return await db.insert(schema.attendanceRecords).values(data).returning();
  },

  async getAttendanceRecordsByClass(classId: number): Promise<any[]> {
    try {
      // Mock implementation
      console.log(`Getting attendance records for class ${classId}`);
      return [];
    } catch (error) {
      console.error('Error getting attendance records by class:', error);
      throw error;
    }
  },

  async getAttendanceRecordsByStudent(studentId: number) {
    return await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.studentId, studentId));
  },

  async deleteUser(userId: number): Promise<boolean> {
    try {
      console.log(`Deleting user with id ${userId}`);
      // В реальном приложении здесь было бы удаление из базы данных
      // Для демонстрационных целей просто возвращаем успех
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async updateUser(userId: number, userData: any): Promise<any> {
    try {
      console.log(`Updating user with id ${userId}`, userData);
      // В реальном приложении здесь было бы обновление в базе данных
      // Для демонстрационных целей возвращаем обновленные данные
      return {
        id: userId,
        ...userData
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // QR Code generation
  async generateQRCode(classId: number) {
    const qrCode = crypto.randomBytes(32).toString('hex');
    await this.updateClass(classId, { qrCode, isActive: true });
    return qrCode;
  }
};
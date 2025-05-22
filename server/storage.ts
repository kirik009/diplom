import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with our schema
const db = drizzle(pool, { schema });

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const storage = {
  // User related operations
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

  async getUser(id: number) {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0] || null;
  },

  async getAllUsers() {
    return await db.select().from(schema.users);
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

  async getAttendanceRecordsByClass(classId: number) {
    return await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.classId, classId));
  },

  async getAttendanceRecordsByStudent(studentId: number) {
    return await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.studentId, studentId));
  },

  // QR Code generation
  async generateQRCode(classId: number) {
    const qrCode = crypto.randomBytes(32).toString('hex');
    await this.updateClass(classId, { qrCode, isActive: true });
    return qrCode;
  }
};
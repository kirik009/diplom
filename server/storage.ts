import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';
import { and, desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  users,
  groups,
  departments,
  faculties,
  subjects,
  classes,
  attendanceRecords,
  reports,
  type InsertUser,
  type User,
  type InsertGroup,
  type Group,
  type InsertDepartment,
  type Department,
  type InsertFaculty,
  type Faculty,
  type InsertSubject,
  type Subject,
  type InsertClass,
  type Class,
  type InsertAttendanceRecord,
  type AttendanceRecord,
  type InsertReport,
  type Report,
} from "../shared/schema";


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
const hashPassword = async(password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const storage = {
  // Операции с пользователями
  async createUser(userData: schema.InsertUser) {
    const hashedPassword = await hashPassword(userData.password);
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
   async getUserById(id: number) {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  },

    async getAllUsers() {
    try {
      const users = await db.select().from(schema.users);
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      return null;
    }
  },

 async getAllClasses() {
    try {
      const users = await db.select().from(schema.classes);
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      return null;
    }
  },

      async deleteUser(id: number) {
   try {
           await db.delete(schema.users).where(eq(schema.users.id, id));
         } catch (error) {
           console.error("Error deleting task:", error);
           throw new Error("Failed to delete task");
         }
  },

    async getAllGroups() {
    try {
      const groups = await db.select({
        id: schema.groups.id,
        name: schema.groups.name,

        facultyName: schema.faculties.name
      }).from(schema.groups).
      leftJoin(schema.faculties, eq(schema.faculties.id, schema.groups.facultyId));
      return groups;
    } catch (error) {
      console.error("Error getting all groups:", error);
      return null;
    }
  },

      async getAllDepartments() {
    try {
      const departments = await db.select({
        id: schema.departments.id,
        name: schema.departments.name,

        facultyName: schema.faculties.name
      }).from(schema.departments).
      leftJoin(schema.faculties, eq(schema.faculties.id, schema.departments.facultyId));
      return departments;
    } catch (error) {
      console.error("Error getting all groups:", error);
      return null;
    }
  },

    async getAllSubjects() {
    try {
      const subjects = await db.select().from(schema.subjects);
      return subjects;
    } catch (error) {
      console.error("Error getting all groups:", error);
      return null;
    }
  },

    async getAllFaculties() {
    try {
      const faculties = await db.select().from(schema.faculties);
      return faculties;
    } catch (error) {
      console.error("Error getting all faculties:", error);
      return null;
    }
  },

   async createFaculty(facultyData: schema.InsertFaculty) {

    return await db.insert(schema.faculties).values(facultyData).returning();
  },

   async deleteFaculty(id: number) {
   try {
           await db.delete(schema.faculties).where(eq(schema.faculties.id, id));
         } catch (error) {
           console.error("Error deleting task:", error);
           throw new Error("Failed to delete task");
         }
  },
    async createGroup(groupData: schema.InsertGroup) {

    return await db.insert(schema.groups).values(groupData).returning();
  },

   async deleteGroup(id: number) {
   try {
           await db.delete(schema.groups).where(eq(schema.groups.id, id));
         } catch (error) {
           console.error("Error deleting task:", error);
           throw new Error("Failed to delete task");
         }
  },


     async createDepartment(departmentData: schema.InsertDepartment) {

    return await db.insert(schema.departments).values(departmentData).returning();
  },

   async deleteDepartment(id: number) {
   try {
           await db.delete(schema.departments).where(eq(schema.departments.id, id));
         } catch (error) {
           console.error("Error deleting department:", error);
           throw new Error("Failed to delete department");
         }
  },
     async createSubject(subjectData: schema.InsertSubject) {

    return await db.insert(schema.subjects).values(subjectData).returning();
  },

   async deleteSubject(id: number) {
   try {
           await db.delete(schema.subjects).where(eq(schema.subjects.id, id));
         } catch (error) {
           console.error("Error deleting subject:", error);
           throw new Error("Failed to delete subject");
         }
  },

       async createClass(classData: schema.InsertClass) {
        classData.endTime = new Date(classData.endTime);
        classData.startTime = new Date(classData.startTime);
        classData.date = new Date(classData.date);
  classData.qrCode = `class:${classData.classroom}:${classData.date.toISOString()}:${classData.teacherId}:${classData.subjectId}:${classData.groupId}`;
    return await db.insert(schema.classes).values(classData).returning();
  },

    async getClassesByTeacher(id: number) {
    try {
      const classes = await db.select().from(schema.classes).where(eq(schema.classes.teacherId, id));
      return classes;
    } catch (error) {
      console.error("Error getting classes by teacher:", error);
      return null;
    }
  },

      async getClassesByGroup(id: number) {
    try {
      const classes = await db.select().from(schema.classes).where(eq(schema.classes.groupId, id));
      return classes;
    } catch (error) {
      console.error("Error getting classes by teacher:", error);
      return null;
    }
  },

  async getClass(id: number) {
    try {
      const [user] = await db.select().from(schema.classes).where(eq(schema.classes.id, id));
      return user;
    } catch (error) {
      console.error("Error getting class:", error);
      return null;
    }
  },

    async updateClass(id: number, updatedClass: Partial<schema.InsertClass>) {
      try {
            const [updatedExercise] = await db
              .update(schema.classes)
              .set(updatedClass)
              .where(eq(schema.classes.id, id))
              .returning();

            return updatedExercise;
          } catch (error) {
            console.error("Error ending class:", error);
            return undefined;
          }
  },

  async getActiveClassByQrCode(qrCode: string) {
    try {
      const [classes] = await db.select().from(schema.classes).where(and(eq(schema.classes.qrCode, qrCode),
        eq(schema.classes.isActive, true)));
      return classes;
    } catch (error) {
      console.error("Error getting classes by this qr code:", error);
      return null;
    }
  },

    async getAttendanceRecordsByClass(classId: number) {
    try {
      const classes = await db.select().from(schema.attendanceRecords).where(eq(schema.attendanceRecords.classId, classId));
      return classes;
    } catch (error) {
      console.error("Error getting classes by this qr code:", error);
      return [];
    }
  },



      async createAttendanceRecord(groupData: schema.InsertAttendanceRecord) {

    return await db.insert(schema.attendanceRecords).values(groupData).returning();
  },

      async getStudentsByGroupId(groupId: number) {
    try {
      const classes = await db.select().from(schema.users).where(eq(schema.users.groupId, groupId));
      return classes;
    } catch (error) {
      console.error("Error getting classes by this qr code:", error);
      return null;
    }
  },

  // Reports methods
  async getAllReports() {
    try {
      const reportsData = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt));
      return reportsData;
    } catch (error) {
      console.error("Error getting all reports:", error);
      return null;
    }
  },

  async getReportById(id: number) {
    try {
      const result = await db.select().from(schema.reports).where(eq(schema.reports.id, id));
      return result[0] || null;
    } catch (error) {
      console.error("Error getting report by id:", error);
      return null;
    }
  },

  async createReport(reportData: InsertReport) {
      return await db.insert(schema.reports).values(reportData).returning();
  },

  async deleteReport(id: number) {
    try {
      await db.delete(schema.reports).where(eq(schema.reports.id, id));
    } catch (error) {
      console.error("Error deleting report:", error);
      throw new Error("Failed to delete report");
    }
  },
};
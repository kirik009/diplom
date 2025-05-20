import { 
  User, InsertUser, 
  Group, InsertGroup, 
  Department, InsertDepartment,
  Faculty, InsertFaculty,
  Subject, InsertSubject,
  Class, InsertClass,
  AttendanceRecord, InsertAttendanceRecord,
  Report, InsertReport
} from "@shared/schema";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  getAllGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  
  // Faculty operations
  getFaculty(id: number): Promise<Faculty | undefined>;
  getAllFaculties(): Promise<Faculty[]>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  
  // Subject operations
  getSubject(id: number): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Class operations
  getClass(id: number): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  getClassesByGroup(groupId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined>;
  generateQRCode(classId: number): Promise<string | undefined>;
  
  // Attendance operations
  getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined>;
  getAttendanceRecordsByClass(classId: number): Promise<AttendanceRecord[]>;
  getAttendanceRecordsByStudent(studentId: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  
  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Gamification operations
  getUserProgress(userId: number): Promise<any>;
  updateUserProgress(userId: number, progress: any): Promise<any>;
  getUserAchievements(userId: number): Promise<any[]>;
  unlockAchievement(userId: number, achievementId: number): Promise<void>;
  getLevelForPoints(points: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private groups: Map<number, Group>;
  private departments: Map<number, Department>;
  private faculties: Map<number, Faculty>;
  private subjects: Map<number, Subject>;
  private classes: Map<number, Class>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private reports: Map<number, Report>;
  private userProgress: Map<number, any>;
  private userAchievements: Map<number, Set<number>>;
  
  private currentUserId: number;
  private currentGroupId: number;
  private currentDepartmentId: number;
  private currentFacultyId: number;
  private currentSubjectId: number;
  private currentClassId: number;
  private currentAttendanceId: number;
  private currentReportId: number;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.departments = new Map();
    this.faculties = new Map();
    this.subjects = new Map();
    this.classes = new Map();
    this.attendanceRecords = new Map();
    this.reports = new Map();
    this.userProgress = new Map();
    this.userAchievements = new Map();
    
    this.currentUserId = 1;
    this.currentGroupId = 1;
    this.currentDepartmentId = 1;
    this.currentFacultyId = 1;
    this.currentSubjectId = 1;
    this.currentClassId = 1;
    this.currentAttendanceId = 1;
    this.currentReportId = 1;
    
    // Initialize with some data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create faculties
    const fac1 = this.createFaculty({ name: "Физико-математический" });
    const fac2 = this.createFaculty({ name: "Информационных технологий" });
    
    // Create groups
    const group1 = this.createGroup({ name: "101", facultyId: fac1.id });
    const group2 = this.createGroup({ name: "102", facultyId: fac1.id });
    const group3 = this.createGroup({ name: "201", facultyId: fac2.id });
    
    // Create departments
    const dep1 = this.createDepartment({ name: "Математика", facultyId: fac1.id });
    const dep2 = this.createDepartment({ name: "Информатика", facultyId: fac2.id });
    
    // Create subjects
    const sub1 = this.createSubject({ name: "Математический анализ" });
    const sub2 = this.createSubject({ name: "Программирование" });
    const sub3 = this.createSubject({ name: "Физика" });
    const sub4 = this.createSubject({ name: "Линейная алгебра" });
    const sub5 = this.createSubject({ name: "Информатика" });
    const sub6 = this.createSubject({ name: "Английский язык" });
    
    // Create users
    // Create admin
    this.createUser({
      username: "admin",
      password: "admin", // Простой пароль для тестирования
      role: "admin",
      firstName: "Алексей",
      lastName: "Смирнов",
      middleName: "Иванович",
      departmentId: null,
      groupId: null
    });
    
    // Create teachers
    const teacher1 = this.createUser({
      username: "teacher1",
      password: "teacher1", // Простой пароль для тестирования
      role: "teacher",
      firstName: "Иван",
      lastName: "Петров",
      middleName: "Алексеевич",
      departmentId: dep1.id,
      groupId: null
    });
    
    const teacher2 = this.createUser({
      username: "teacher2",
      password: "teacher2", // Простой пароль для тестирования
      role: "teacher",
      firstName: "Виктор",
      lastName: "Сидоров",
      middleName: "Петрович",
      departmentId: dep2.id,
      groupId: null
    });
    
    // Create students
    const student1 = this.createUser({
      username: "student1",
      password: "student1", // Простой пароль для тестирования
      role: "student",
      firstName: "Сергей",
      lastName: "Иванов",
      middleName: "Викторович",
      departmentId: null,
      groupId: group1.id
    });
    
    const student2 = this.createUser({
      username: "student2",
      password: "student2", // Простой пароль для тестирования
      role: "student",
      firstName: "Анна",
      lastName: "Петрова",
      middleName: "Сергеевна",
      departmentId: null,
      groupId: group2.id
    });
    
    // Create classes
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const class1 = this.createClass({
      subjectId: sub1.id,
      teacherId: teacher1.id,
      groupId: group1.id,
      classroom: "305",
      date: today,
      startTime: new Date(today.setHours(9, 30, 0, 0)),
      endTime: new Date(today.setHours(11, 0, 0, 0)),
      qrCode: null,
      isActive: false
    });
    
    const class2 = this.createClass({
      subjectId: sub2.id,
      teacherId: teacher2.id,
      groupId: group2.id,
      classroom: "413",
      date: today,
      startTime: new Date(today.setHours(11, 15, 0, 0)),
      endTime: new Date(today.setHours(12, 45, 0, 0)),
      qrCode: null,
      isActive: false
    });
    
    const class3 = this.createClass({
      subjectId: sub3.id,
      teacherId: teacher1.id,
      groupId: group3.id,
      classroom: "205",
      date: yesterday,
      startTime: new Date(yesterday.setHours(15, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(16, 30, 0, 0)),
      qrCode: null,
      isActive: false
    });
    
    // Create some attendance records
    this.createAttendanceRecord({
      classId: class1.id,
      studentId: student1.id,
      timestamp: new Date(),
      status: "present"
    });
    
    this.createAttendanceRecord({
      classId: class2.id,
      studentId: student1.id,
      timestamp: new Date(),
      status: "late"
    });
    
    this.createAttendanceRecord({
      classId: class3.id,
      studentId: student1.id,
      timestamp: new Date(),
      status: "absent"
    });
  }
  
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }
  
  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }
  
  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const newGroup: Group = { ...group, id };
    this.groups.set(id, newGroup);
    return newGroup;
  }
  
  // Department operations
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const newDepartment: Department = { ...department, id };
    this.departments.set(id, newDepartment);
    return newDepartment;
  }
  
  // Faculty operations
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }
  
  async getAllFaculties(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }
  
  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentFacultyId++;
    const newFaculty: Faculty = { ...faculty, id };
    this.faculties.set(id, newFaculty);
    return newFaculty;
  }
  
  // Subject operations
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }
  
  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = this.currentSubjectId++;
    const newSubject: Subject = { ...subject, id };
    this.subjects.set(id, newSubject);
    return newSubject;
  }
  
  // Class operations
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }
  
  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }
  
  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.teacherId === teacherId);
  }
  
  async getClassesByGroup(groupId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.groupId === groupId);
  }
  
  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.currentClassId++;
    const newClass: Class = { ...classData, id };
    this.classes.set(id, newClass);
    return newClass;
  }
  
  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    const existingClass = this.classes.get(id);
    if (!existingClass) {
      return undefined;
    }
    
    const updatedClass: Class = { ...existingClass, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }
  
  async generateQRCode(classId: number): Promise<string | undefined> {
    const classItem = this.classes.get(classId);
    if (!classItem) {
      return undefined;
    }
    
    // Generate a unique QR code
    const qrCode = crypto.randomBytes(16).toString('hex');
    
    // Update the class with the QR code and set it as active
    const updatedClass: Class = { 
      ...classItem, 
      qrCode, 
      isActive: true 
    };
    
    this.classes.set(classId, updatedClass);
    return qrCode;
  }
  
  // Attendance operations
  async getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }
  
  async getAttendanceRecordsByClass(classId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.classId === classId);
  }
  
  async getAttendanceRecordsByStudent(studentId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.studentId === studentId);
  }
  
  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.currentAttendanceId++;
    const newRecord: AttendanceRecord = { ...record, id };
    this.attendanceRecords.set(id, newRecord);
    return newRecord;
  }
  
  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }
  
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }
  
  async createReport(report: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const newReport: Report = { ...report, id };
    this.reports.set(id, newReport);
    return newReport;
  }

  // Gamification operations
  async getUserProgress(userId: number): Promise<any> {
    if (!this.userProgress.has(userId)) {
      // Initialize user progress with default values
      const defaultProgress = {
        userId,
        points: 0,
        streak: 0,
        lastAttendance: null,
        level: 1,
        achievements: []
      };
      this.userProgress.set(userId, defaultProgress);
      this.userAchievements.set(userId, new Set());
    }
    return this.userProgress.get(userId);
  }

  async updateUserProgress(userId: number, progress: any): Promise<any> {
    const currentProgress = await this.getUserProgress(userId);
    const updatedProgress = { ...currentProgress, ...progress };
    this.userProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    const { achievements: achievementIds } = await this.getUserProgress(userId);
    const achievementsList = [];

    for (const id of achievementIds) {
      // Import achievements from shared gamification file
      const achievement = require("@shared/gamification").achievements.find(
        (a: any) => a.id === id
      );
      if (achievement) {
        achievementsList.push({ ...achievement, unlocked: true });
      }
    }

    // Also add locked achievements
    const lockedAchievements = require("@shared/gamification").achievements
      .filter((a: any) => !achievementIds.includes(a.id))
      .map((a: any) => ({ ...a, unlocked: false }));

    return [...achievementsList, ...lockedAchievements];
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<void> {
    const userProgress = await this.getUserProgress(userId);
    if (!userProgress.achievements.includes(achievementId)) {
      userProgress.achievements.push(achievementId);
      userProgress.points += 50; // Bonus points for achievement
      await this.updateUserProgress(userId, userProgress);
    }
  }

  async getLevelForPoints(points: number): Promise<any> {
    const levels = require("@shared/gamification").levels;
    return levels.find(
      (level: any) => points >= level.minPoints && points <= level.maxPoints
    );
  }
}

export const storage = new MemStorage();

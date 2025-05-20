import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertAttendanceRecordSchema } from "@shared/schema";
import { z } from "zod";
import * as crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";

declare module "express-session" {
  interface SessionData {
    userId: number;
    role: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "attendance-tracking-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Middleware to check if user has specific role
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (req.session.userId && roles.includes(req.session.role)) {
        next();
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    };
  };

  // Authentication routes
  // Регистрация нового пользователя
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Создаем пользователя с ролью "student" по умолчанию
      const { username, password, firstName, lastName, middleName, groupId } = req.body;
      
      // Проверяем, существует ли пользователь с таким именем
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
      }
      
      // Создаем нового пользователя
      const newUser = await storage.createUser({
        username,
        password,
        role: "student", // По умолчанию все новые пользователи - студенты
        firstName,
        lastName,
        middleName: middleName || null,
        groupId: groupId || null,
        departmentId: null
      });
      
      // Удаляем пароль из ответа
      const { password: _, ...userWithoutPassword } = newUser;
      
      console.log("Создан новый пользователь:", username);
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      res.status(500).json({ message: "Ошибка сервера при регистрации" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt received for:", req.body.username);
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user) {
        console.log("User not found:", credentials.username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Found user:", user.username, "with role:", user.role);
      
      // Простая проверка паролей для демо-версии
      console.log("Password check:", user.password === credentials.password);
      
      if (user.password !== credentials.password) {
        console.log("Invalid password for user:", credentials.username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("Authentication successful for:", credentials.username);

      // Set session data
      req.session.userId = user.id;
      req.session.role = user.role;

      // Return user info without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user info without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Teacher routes
  // Generate QR code for a class
  app.post(
    "/api/teacher/classes/:id/qr",
    isAuthenticated,
    hasRole(["teacher", "admin"]),
    async (req: Request, res: Response) => {
      try {
        const classId = parseInt(req.params.id);
        const classItem = await storage.getClass(classId);

        if (!classItem) {
          return res.status(404).json({ message: "Class not found" });
        }

        // Check if the teacher is authorized for this class
        if (
          classItem.teacherId !== req.session.userId &&
          req.session.role !== "admin"
        ) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const qrCode = await storage.generateQRCode(classId);
        if (!qrCode) {
          return res.status(500).json({ message: "Failed to generate QR code" });
        }

        res.json({ qrCode });
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get teacher's classes
  app.get(
    "/api/teacher/classes",
    isAuthenticated,
    hasRole(["teacher", "admin"]),
    async (req: Request, res: Response) => {
      try {
        const classes = await storage.getClassesByTeacher(req.session.userId!);
        res.json(classes);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Create a new class
  app.post(
    "/api/teacher/classes",
    isAuthenticated,
    hasRole(["teacher", "admin"]),
    async (req: Request, res: Response) => {
      try {
        const newClass = {
          ...req.body,
          teacherId: req.session.userId!,
          qrCode: null,
          isActive: false,
        };
        
        const classItem = await storage.createClass(newClass);
        res.status(201).json(classItem);
      } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    }
  );

  // Get attendance records for a class
  app.get(
    "/api/teacher/classes/:id/attendance",
    isAuthenticated,
    hasRole(["teacher", "admin"]),
    async (req: Request, res: Response) => {
      try {
        const classId = parseInt(req.params.id);
        const classItem = await storage.getClass(classId);

        if (!classItem) {
          return res.status(404).json({ message: "Class not found" });
        }

        // Check if the teacher is authorized for this class
        if (
          classItem.teacherId !== req.session.userId &&
          req.session.role !== "admin"
        ) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const attendanceRecords = await storage.getAttendanceRecordsByClass(classId);
        res.json(attendanceRecords);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );
  
  // End active class
  app.post(
    "/api/teacher/classes/:id/end",
    isAuthenticated,
    hasRole(["teacher", "admin"]),
    async (req: Request, res: Response) => {
      try {
        const classId = parseInt(req.params.id);
        const classItem = await storage.getClass(classId);

        if (!classItem) {
          return res.status(404).json({ message: "Class not found" });
        }

        // Check if the teacher is authorized for this class
        if (
          classItem.teacherId !== req.session.userId &&
          req.session.role !== "admin"
        ) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedClass = await storage.updateClass(classId, { 
          isActive: false,
          qrCode: null
        });
        
        res.json(updatedClass);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Student routes
  // Get student's attendance records
  app.get(
    "/api/student/attendance",
    isAuthenticated,
    hasRole(["student"]),
    async (req: Request, res: Response) => {
      try {
        const attendanceRecords = await storage.getAttendanceRecordsByStudent(
          req.session.userId!
        );
        res.json(attendanceRecords);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Student scans QR code to mark attendance
  app.post(
    "/api/student/attendance",
    isAuthenticated,
    hasRole(["student"]),
    async (req: Request, res: Response) => {
      try {
        const { qrCode } = req.body;
        
        if (!qrCode) {
          return res.status(400).json({ message: "QR code is required" });
        }
        
        // Find the class with this QR code
        const classes = await storage.getAllClasses();
        const classItem = classes.find(c => c.qrCode === qrCode && c.isActive);
        
        if (!classItem) {
          return res.status(404).json({ message: "Invalid or expired QR code" });
        }
        
        // Check if the student belongs to the class's group
        const student = await storage.getUser(req.session.userId!);
        if (!student || student.groupId !== classItem.groupId) {
          return res.status(403).json({ message: "You are not enrolled in this class" });
        }
        
        // Check if attendance already recorded
        const existingRecords = await storage.getAttendanceRecordsByClass(classItem.id);
        const alreadyRecorded = existingRecords.some(r => r.studentId === req.session.userId);
        
        if (alreadyRecorded) {
          return res.status(400).json({ message: "Attendance already recorded" });
        }
        
        // Determine if the student is late
        const now = new Date();
        const lateThreshold = new Date(classItem.startTime);
        lateThreshold.setMinutes(lateThreshold.getMinutes() + 15); // 15 min grace period
        
        const status = now > lateThreshold ? "late" : "present";
        
        // Record attendance
        const attendanceData = {
          classId: classItem.id,
          studentId: req.session.userId!,
          timestamp: now,
          status
        };
        
        const record = await storage.createAttendanceRecord(attendanceData);
        res.status(201).json(record);
      } catch (err) {
        if (err instanceof z.ZodError) {
          res.status(400).json({ message: err.errors });
        } else {
          res.status(500).json({ message: "Internal server error" });
        }
      }
    }
  );
  
  // Get student's classes
  app.get(
    "/api/student/classes",
    isAuthenticated,
    hasRole(["student"]),
    async (req: Request, res: Response) => {
      try {
        const student = await storage.getUser(req.session.userId!);
        if (!student || !student.groupId) {
          return res.status(404).json({ message: "Student or group not found" });
        }
        
        const classes = await storage.getClassesByGroup(student.groupId);
        res.json(classes);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin routes
  // Get all users
  app.get(
    "/api/admin/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        const users = await storage.getAllUsers();
        // Remove passwords from the response
        const sanitizedUsers = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        res.json(sanitizedUsers);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all classes
  app.get(
    "/api/admin/classes",
    isAuthenticated,
    hasRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        const classes = await storage.getAllClasses();
        res.json(classes);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all attendance records
  app.get(
    "/api/admin/attendance",
    isAuthenticated,
    hasRole(["admin"]),
    async (req: Request, res: Response) => {
      try {
        // Since we don't have a direct method to get all records, we'll combine class-specific ones
        const classes = await storage.getAllClasses();
        let allRecords: any[] = [];
        
        // Fetch attendance records for each class
        for (const cls of classes) {
          const records = await storage.getAttendanceRecordsByClass(cls.id);
          allRecords = [...allRecords, ...records];
        }
        
        res.json(allRecords);
      } catch (err) {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get all subjects
  app.get("/api/subjects", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all groups
  app.get("/api/groups", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Gamification routes
  app.get("/api/student/progress", async (req: Request, res: Response) => {
    try {
      // Mock progress data for demo purposes
      const userProgress = {
        points: 125,
        streak: 7,
        level: 2,
        achievements: [1, 3, 5],
        levelInfo: {
          level: 2,
          title: "Прилежный студент",
          minPoints: 100,
          maxPoints: 200
        }
      };
      res.json(userProgress);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get("/api/student/achievements", async (req: Request, res: Response) => {
    try {
      // Mock achievements data for demo purposes
      const achievements = [
        {
          id: 1,
          name: "Первое посещение",
          description: "Вы отметили свое первое посещение",
          icon: "Star",
          unlocked: true,
          unlockedAt: new Date("2025-05-10")
        },
        {
          id: 2,
          name: "Пунктуальность",
          description: "5 посещений без опозданий",
          icon: "Calendar",
          unlocked: false
        },
        {
          id: 3,
          name: "Отличная неделя",
          description: "Посещены все занятия за неделю",
          icon: "Trophy",
          unlocked: true,
          unlockedAt: new Date("2025-05-15")
        },
        {
          id: 4,
          name: "Стабильность",
          description: "Посещение 10 занятий подряд",
          icon: "Target",
          unlocked: false
        },
        {
          id: 5,
          name: "Серия успехов",
          description: "7 дней посещений подряд",
          icon: "Flame",
          unlocked: true,
          unlockedAt: new Date("2025-05-18")
        },
        {
          id: 6,
          name: "Продвинутый",
          description: "Достигнут 3-й уровень студента",
          icon: "Award",
          unlocked: false
        }
      ];
      res.json(achievements);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });
  
  // Update attendance endpoint to handle gamification
  app.patch("/api/student/attendance/:id/qr", isAuthenticated, hasRole(["student"]), async (req: Request, res: Response) => {
    try {
      const { qrCode } = req.body;
      const userId = req.session.userId!;
      
      // Regular attendance logic
      const attendanceRecord = await storage.createAttendanceRecord({
        classId: parseInt(req.params.id),
        studentId: userId,
        timestamp: new Date(),
        status: "present"
      });
      
      // Gamification logic
      const userProgress = await storage.getUserProgress(userId);
      
      // Add attendance points
      userProgress.points += 10;
      
      // Update streak
      const lastAttendanceDate = userProgress.lastAttendance ? new Date(userProgress.lastAttendance) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastAttendanceDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        if (lastAttendanceDate.getTime() === yesterday.getTime()) {
          userProgress.streak += 1;
          userProgress.points += 5; // Bonus for maintaining streak
        } else if (lastAttendanceDate.getTime() < yesterday.getTime()) {
          userProgress.streak = 1; // Reset streak
        }
      } else {
        userProgress.streak = 1; // First attendance
      }
      
      userProgress.lastAttendance = today;
      
      // Update level based on points
      const level = await storage.getLevelForPoints(userProgress.points);
      userProgress.level = level.level;
      
      // Check for achievements
      const attendanceRecords = await storage.getAttendanceRecordsByStudent(userId);
      const totalAttendance = attendanceRecords.length;
      
      // First attendance achievement
      if (totalAttendance === 1) {
        await storage.unlockAchievement(userId, 1);
      }
      
      // 10 attendances achievement
      if (totalAttendance === 10) {
        await storage.unlockAchievement(userId, 2);
      }
      
      // 50 attendances achievement
      if (totalAttendance === 50) {
        await storage.unlockAchievement(userId, 3);
      }
      
      // Streak achievements
      if (userProgress.streak === 7) {
        await storage.unlockAchievement(userId, 4); // Week streak
      }
      
      if (userProgress.streak === 30) {
        await storage.unlockAchievement(userId, 5); // Month streak
      }
      
      // Points achievements
      if (userProgress.points >= 100 && !userProgress.achievements.includes(6)) {
        await storage.unlockAchievement(userId, 6); // 100 points
      }
      
      if (userProgress.points >= 1000 && !userProgress.achievements.includes(7)) {
        await storage.unlockAchievement(userId, 7); // 1000 points
      }
      
      if (userProgress.points >= 10000 && !userProgress.achievements.includes(8)) {
        await storage.unlockAchievement(userId, 8); // 10000 points
      }
      
      // Save progress
      await storage.updateUserProgress(userId, userProgress);
      
      res.json({
        attendanceRecord,
        progress: {
          ...userProgress,
          levelInfo: level
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

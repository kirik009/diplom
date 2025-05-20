import { z } from 'zod';

export const pointsRulesSchema = z.object({
  attendance: z.number().default(10), // Points for attending a class
  perfectWeek: z.number().default(50), // Bonus points for perfect attendance in a week
  perfectMonth: z.number().default(200), // Bonus points for perfect attendance in a month
  earlyArrival: z.number().default(5), // Bonus points for arriving early
  consistentAttendance: z.number().default(15), // Bonus for attending consecutive classes
});

export type PointsRules = z.infer<typeof pointsRulesSchema>;

export const achievementSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  requiredPoints: z.number().optional(),
  requiredAttendance: z.number().optional(),
  requiredConsecutiveDays: z.number().optional(),
  unlocked: z.boolean().default(false),
  unlockedAt: z.date().nullable().optional(),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const levelSchema = z.object({
  level: z.number(),
  title: z.string(),
  minPoints: z.number(),
  maxPoints: z.number(),
});

export type Level = z.infer<typeof levelSchema>;

export const userProgressSchema = z.object({
  userId: z.number(),
  points: z.number().default(0),
  streak: z.number().default(0), // Consecutive days with attendance
  lastAttendance: z.date().nullable().optional(),
  level: z.number().default(1),
  achievements: z.array(z.number()).default([]), // Achievement IDs
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Predefined levels
export const levels: Level[] = [
  { level: 1, title: "Новичок", minPoints: 0, maxPoints: 99 },
  { level: 2, title: "Студент", minPoints: 100, maxPoints: 299 },
  { level: 3, title: "Прилежный ученик", minPoints: 300, maxPoints: 599 },
  { level: 4, title: "Отличник", minPoints: 600, maxPoints: 999 },
  { level: 5, title: "Академик", minPoints: 1000, maxPoints: 1999 },
  { level: 6, title: "Вундеркинд", minPoints: 2000, maxPoints: 3499 },
  { level: 7, title: "Гений", minPoints: 3500, maxPoints: 5999 },
  { level: 8, title: "Мастер знаний", minPoints: 6000, maxPoints: 9999 },
  { level: 9, title: "Легенда универа", minPoints: 10000, maxPoints: Infinity },
];

// Predefined achievements
export const achievements: Achievement[] = [
  {
    id: 1,
    name: "Первые шаги",
    description: "Отметить присутствие на первом занятии",
    icon: "Star",
    requiredAttendance: 1,
    unlocked: false
  },
  {
    id: 2,
    name: "Прилежный студент",
    description: "Отметить присутствие на 10 занятиях",
    icon: "Award",
    requiredAttendance: 10,
    unlocked: false
  },
  {
    id: 3,
    name: "Отличник",
    description: "Отметить присутствие на 50 занятиях",
    icon: "Medal",
    requiredAttendance: 50,
    unlocked: false
  },
  {
    id: 4,
    name: "Неделя совершенства",
    description: "Посетить все занятия в течение недели",
    icon: "Calendar",
    requiredConsecutiveDays: 7,
    unlocked: false
  },
  {
    id: 5,
    name: "Месяц совершенства",
    description: "Посетить все занятия в течение месяца",
    icon: "Trophy",
    requiredConsecutiveDays: 30,
    unlocked: false
  },
  {
    id: 6,
    name: "Сотня",
    description: "Набрать 100 очков",
    icon: "100",
    requiredPoints: 100,
    unlocked: false
  },
  {
    id: 7,
    name: "Тысяча",
    description: "Набрать 1000 очков",
    icon: "1000",
    requiredPoints: 1000,
    unlocked: false
  },
  {
    id: 8,
    name: "Десять тысяч",
    description: "Набрать 10000 очков",
    icon: "Target",
    requiredPoints: 10000,
    unlocked: false
  },
];

// Default points rules
export const defaultPointsRules: PointsRules = {
  attendance: 10,
  perfectWeek: 50,
  perfectMonth: 200,
  earlyArrival: 5,
  consistentAttendance: 15
};
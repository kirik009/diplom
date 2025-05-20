import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd.MM.yyyy");
}

export function formatTime(date: Date | string): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd.MM.yyyy, HH:mm");
}

export function calculateAttendancePercentage(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

export function getAttendanceStatusColor(percentage: number): string {
  if (percentage >= 80) return "success";
  if (percentage >= 60) return "warning";
  return "error";
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "student":
      return "Студент";
    case "teacher":
      return "Преподаватель";
    case "admin":
      return "Администратор";
    default:
      return role;
  }
}

// Helper to get the full name from user data
export function getFullName(user: { firstName: string; lastName: string; middleName?: string }): string {
  if (!user) return "";
  return `${user.lastName} ${user.firstName}${user.middleName ? ` ${user.middleName}` : ""}`;
}

// Helper to get the initials from user data
export function getInitials(user: { firstName: string; lastName: string }): string {
  if (!user) return "";
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

// Helper for time remaining calculation
export function getTimeRemaining(endTime: Date | string): string {
  const end = typeof endTime === "string" ? new Date(endTime) : endTime;
  const now = new Date();
  
  if (now > end) return "Завершено";
  
  const diffMs = end.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }
  return `${mins} мин`;
}

// server/seed.ts
import { db } from "server/storage"; // путь к инициализированной drizzle db
import { users } from "shared/schema"; // путь к твоим таблицам
import bcrypt from "bcryptjs"; // хешируем пароли

export async function seedDemoAccounts() {
  const demoUsers = [
    {
      username: "student_demo",
      password: await bcrypt.hash("demo123", 10),
      role: "student",
      firstName: "Student",
      lastName: "Demo",
      middleName: null,
      groupId: null,
      departmentId: null,
    },
    {
      username: "teacher_demo",
      password: await bcrypt.hash("demo123", 10),
      role: "teacher",
      firstName: "Teacher",
      lastName: "Demo",
      middleName: null,
      groupId: null,
      departmentId: null,
    },
    {
      username: "admin_demo",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      firstName: "Admin",
      lastName: "Demo",
      middleName: null,
      groupId: null,
      departmentId: null,
    },
  ];

  for (const user of demoUsers) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, user.username),
    });

    if (!existing) {
      await db.insert(users).values(user);
      console.log(`[seed] Created demo user: ${user.username}`);
    } else {
      console.log(`[seed] Demo user already exists: ${user.username}`);
    }
  }
}

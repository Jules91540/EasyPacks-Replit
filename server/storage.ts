import {
  users,
  modules,
  quizzes,
  moduleProgress,
  quizAttempts,
  badges,
  userBadges,
  simulationUsage,
  type User,
  type UpsertUser,
  type Module,
  type InsertModule,
  type Quiz,
  type InsertQuiz,
  type ModuleProgress,
  type InsertModuleProgress,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type SimulationUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Module operations
  getModules(): Promise<Module[]>;
  getPublishedModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<Module>;
  deleteModule(id: number): Promise<void>;
  
  // Quiz operations
  getQuizzesByModule(moduleId: number): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  
  // Progress operations
  getUserModuleProgress(userId: string): Promise<ModuleProgress[]>;
  getModuleProgress(userId: string, moduleId: number): Promise<ModuleProgress | undefined>;
  updateModuleProgress(progress: InsertModuleProgress): Promise<ModuleProgress>;
  
  // Quiz attempt operations
  getUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getBestQuizAttempt(userId: string, quizId: number): Promise<QuizAttempt | undefined>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(userId: string, badgeId: number): Promise<UserBadge>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // XP and level operations
  updateUserXP(userId: string, xpToAdd: number): Promise<User>;
  calculateLevel(xp: number): number;
  
  // Simulation operations
  recordSimulationUsage(userId: string, simulationType: string): Promise<SimulationUsage>;
  
  // Stats operations
  getStudentStats(): Promise<{
    totalStudents: number;
    totalModules: number;
    totalQuizzes: number;
    averageProgress: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Module operations
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.order);
  }

  async getPublishedModules(): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.isPublished, true))
      .orderBy(modules.order);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: number, module: Partial<InsertModule>): Promise<Module> {
    const [updatedModule] = await db
      .update(modules)
      .set({ ...module, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: number): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  // Quiz operations
  async getQuizzesByModule(moduleId: number): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({ ...quiz, updatedAt: new Date() })
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // Progress operations
  async getUserModuleProgress(userId: string): Promise<ModuleProgress[]> {
    return await db
      .select()
      .from(moduleProgress)
      .where(eq(moduleProgress.userId, userId));
  }

  async getModuleProgress(userId: string, moduleId: number): Promise<ModuleProgress | undefined> {
    const [progress] = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.userId, userId),
          eq(moduleProgress.moduleId, moduleId)
        )
      );
    return progress;
  }

  async updateModuleProgress(progress: InsertModuleProgress): Promise<ModuleProgress> {
    const existing = await this.getModuleProgress(progress.userId, progress.moduleId);
    
    if (existing) {
      const [updated] = await db
        .update(moduleProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(moduleProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newProgress] = await db
        .insert(moduleProgress)
        .values(progress)
        .returning();
      return newProgress;
    }
  }

  // Quiz attempt operations
  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db
      .insert(quizAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getBestQuizAttempt(userId: string, quizId: number): Promise<QuizAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.quizId, quizId)
        )
      )
      .orderBy(desc(quizAttempts.score))
      .limit(1);
    return attempt;
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async awardBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const [newBadge] = await db
      .insert(userBadges)
      .values({ userId, badgeId })
      .returning();
    return newBadge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  // XP and level operations
  async updateUserXP(userId: string, xpToAdd: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const newXp = user.xp + xpToAdd;
    const newLevel = this.calculateLevel(newXp);

    const [updatedUser] = await db
      .update(users)
      .set({ 
        xp: newXp, 
        level: newLevel,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  calculateLevel(xp: number): number {
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    // Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  // Simulation operations
  async recordSimulationUsage(userId: string, simulationType: string): Promise<SimulationUsage> {
    const [usage] = await db
      .insert(simulationUsage)
      .values({ userId, simulationType })
      .returning();
    return usage;
  }

  // Stats operations
  async getStudentStats(): Promise<{
    totalStudents: number;
    totalModules: number;
    totalQuizzes: number;
    averageProgress: number;
  }> {
    const [studentsCount] = await db
      .select({ count: eq(users.role, "student") })
      .from(users);
    
    const [modulesCount] = await db
      .select({ count: modules.id })
      .from(modules);
    
    const [quizzesCount] = await db
      .select({ count: quizzes.id })
      .from(quizzes);

    // Calculate average progress (simplified)
    const allProgress = await db.select().from(moduleProgress);
    const averageProgress = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + p.progress, 0) / allProgress.length
      : 0;

    return {
      totalStudents: studentsCount?.count || 0,
      totalModules: modulesCount?.count || 0,
      totalQuizzes: quizzesCount?.count || 0,
      averageProgress: Math.round(averageProgress),
    };
  }
}

export const storage = new DatabaseStorage();

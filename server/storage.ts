import {
  users,
  modules,
  quizzes,
  moduleProgress,
  quizAttempts,
  badges,
  userBadges,
  simulationUsage,
  emailLogs,
  friendships,
  socialPosts,
  postLikes,
  postComments,
  privateMessages,
  conversations,
  callSessions,
  notificationsTable,
  messageReactions,
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
  type EmailLog,
  type InsertEmailLog,
  type Friendship,
  type InsertFriendship,
  type SocialPost,
  type InsertSocialPost,
  type PostLike,
  type InsertPostLike,
  type PostComment,
  type InsertPostComment,
  type PrivateMessage,
  type InsertPrivateMessage,
  type ConversationWithParticipant,
  type InsertConversation,
  type CallSession,
  type InsertCallSession,
  type NotificationTable,
  type InsertNotificationTable,
  type MessageReaction,
  type InsertMessageReaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, or, sql, like } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteNonAdminUsers(): Promise<number>;
  
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
  
  // Email operations
  logEmail(emailLog: InsertEmailLog): Promise<EmailLog>;
  getUserEmails(userId: string): Promise<EmailLog[]>;
  
  // Password operations
  updatePassword(userId: string, newPasswordHash: string): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  
  // Settings operations
  updateEmailPreferences(userId: string, preferences: any): Promise<User>;
  updatePrivacySettings(userId: string, settings: any): Promise<User>;
  
  // Stats operations
  getStudentStats(): Promise<{
    totalStudents: number;
    totalModules: number;
    totalQuizzes: number;
    averageProgress: number;
  }>;

  // Social operations - Friends
  sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship>;
  acceptFriendRequest(friendshipId: number): Promise<Friendship>;
  rejectFriendRequest(friendshipId: number): Promise<void>;
  blockUser(senderId: string, receiverId: string): Promise<Friendship>;
  getUserFriends(userId: string): Promise<User[]>;
  getPendingFriendRequests(userId: string): Promise<Friendship[]>;
  getSentFriendRequests(userId: string): Promise<Friendship[]>;
  
  // Social operations - Posts
  createPost(post: InsertSocialPost): Promise<SocialPost>;
  getPosts(userId?: string, visibility?: string): Promise<SocialPost[]>;
  getUserPosts(userId: string): Promise<SocialPost[]>;
  likePost(userId: string, postId: number): Promise<PostLike>;
  unlikePost(userId: string, postId: number): Promise<void>;
  commentOnPost(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: number): Promise<PostComment[]>;
  deletePost(postId: number, userId: string): Promise<void>;
  
  // Social operations - Messages
  sendMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]>;
  getUserConversations(userId: string): Promise<ConversationWithParticipant[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Message reactions
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: number, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: number): Promise<MessageReaction[]>;
  
  // Social operations - Calls
  initiateCall(call: InsertCallSession): Promise<CallSession>;
  updateCallStatus(callId: number, status: string, duration?: number): Promise<CallSession>;
  getUserCallHistory(userId: string): Promise<CallSession[]>;
  
  // Social operations - Notifications
  createNotification(notification: InsertNotificationTable): Promise<NotificationTable>;
  getUserNotifications(userId: string): Promise<NotificationTable[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Search operations
  searchUsers(query: string, excludeUserId?: string): Promise<User[]>;
  
  // Friend removal
  removeFriend(userId: string, friendId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to find existing user by email first
      if (userData.email) {
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
          // Update existing user - only update allowed fields
          const updateFields: Partial<UpsertUser> = {};
          if (userData.firstName !== undefined) updateFields.firstName = userData.firstName;
          if (userData.lastName !== undefined) updateFields.lastName = userData.lastName;
          if (userData.profileImageUrl !== undefined) updateFields.profileImageUrl = userData.profileImageUrl;
          
          if (Object.keys(updateFields).length > 0) {
            updateFields.updatedAt = new Date();
            const [user] = await db
              .update(users)
              .set(updateFields)
              .where(eq(users.id, existingUser.id))
              .returning();
            return user;
          }
          return existingUser;
        }
      }

      // Try to find existing user by ID if provided
      if (userData.id) {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
          // Update existing user - only update allowed fields
          const updateFields: Partial<UpsertUser> = {};
          if (userData.firstName !== undefined) updateFields.firstName = userData.firstName;
          if (userData.lastName !== undefined) updateFields.lastName = userData.lastName;
          if (userData.profileImageUrl !== undefined) updateFields.profileImageUrl = userData.profileImageUrl;
          if (userData.email !== undefined) updateFields.email = userData.email;
          
          if (Object.keys(updateFields).length > 0) {
            updateFields.updatedAt = new Date();
            const [user] = await db
              .update(users)
              .set(updateFields)
              .where(eq(users.id, existingUser.id))
              .returning();
            return user;
          }
          return existingUser;
        }
      }

      // Create new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error("Error in upsertUser:", error);
      // If there's still a conflict, try to update by email
      if (userData.email && error instanceof Error && error.message.includes('duplicate key')) {
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
          const updateFields: Partial<UpsertUser> = {};
          if (userData.firstName !== undefined) updateFields.firstName = userData.firstName;
          if (userData.lastName !== undefined) updateFields.lastName = userData.lastName;
          if (userData.profileImageUrl !== undefined) updateFields.profileImageUrl = userData.profileImageUrl;
          
          if (Object.keys(updateFields).length > 0) {
            updateFields.updatedAt = new Date();
            const [user] = await db
              .update(users)
              .set(updateFields)
              .where(eq(users.id, existingUser.id))
              .returning();
            return user;
          }
          return existingUser;
        }
      }
      throw error;
    }
  }

  async deleteNonAdminUsers(): Promise<number> {
    const result = await db
      .delete(users)
      .where(ne(users.role, 'admin'))
      .returning();
    return result.length;
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
    // Count students
    const studentUsers = await db.select().from(users).where(eq(users.role, "student"));
    const totalStudents = studentUsers.length;
    
    // Count modules
    const allModules = await db.select().from(modules);
    const totalModules = allModules.length;
    
    // Count quizzes
    const allQuizzes = await db.select().from(quizzes);
    const totalQuizzes = allQuizzes.length;

    // Calculate average progress (simplified)
    const allProgress = await db.select().from(moduleProgress);
    const averageProgress = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + p.progress, 0) / allProgress.length
      : 0;

    return {
      totalStudents: totalStudents,
      totalModules: totalModules,
      totalQuizzes: totalQuizzes,
      averageProgress: Math.round(averageProgress),
    };
  }

  // Email operations
  async logEmail(emailLog: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db
      .insert(emailLogs)
      .values(emailLog)
      .returning();
    return log;
  }

  async getUserEmails(userId: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId))
      .orderBy(desc(emailLogs.sentAt));
  }

  // Password operations
  async updatePassword(userId: string, newPasswordHash: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user?.passwordHash) {
      // For OAuth users without password, return false
      return false;
    }
    
    return await bcrypt.compare(password, user.passwordHash);
  }

  // Settings operations
  async updateEmailPreferences(userId: string, preferences: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        emailPreferences: preferences,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updatePrivacySettings(userId: string, settings: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        privacySettings: settings,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Social operations - Friends
  async sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.senderId, senderId), eq(friendships.receiverId, receiverId)),
          and(eq(friendships.senderId, receiverId), eq(friendships.receiverId, senderId))
        )
      )
      .limit(1);

    if (existingFriendship.length > 0) {
      throw new Error('Friendship already exists or request already sent');
    }

    const [friendship] = await db
      .insert(friendships)
      .values({
        senderId,
        receiverId,
        status: "pending"
      })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(friendshipId: number): Promise<Friendship> {
    const [friendship] = await db
      .update(friendships)
      .set({ 
        status: "accepted",
        updatedAt: new Date()
      })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return friendship;
  }

  async rejectFriendRequest(friendshipId: number): Promise<void> {
    await db
      .delete(friendships)
      .where(eq(friendships.id, friendshipId));
  }

  async blockUser(senderId: string, receiverId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        senderId,
        receiverId,
        status: "blocked"
      })
      .onConflictDoUpdate({
        target: [friendships.senderId, friendships.receiverId],
        set: { 
          status: "blocked",
          updatedAt: new Date()
        }
      })
      .returning();
    return friendship;
  }

  async getUserFriends(userId: string): Promise<User[]> {
    const friendshipsResult = await db
      .select({
        user: users
      })
      .from(friendships)
      .innerJoin(users, or(
        and(eq(friendships.senderId, userId), eq(users.id, friendships.receiverId)),
        and(eq(friendships.receiverId, userId), eq(users.id, friendships.senderId))
      ))
      .where(eq(friendships.status, "accepted"));
    
    return friendshipsResult.map(result => result.user);
  }

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    const results = await db
      .select({
        id: friendships.id,
        senderId: friendships.senderId,
        receiverId: friendships.receiverId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl
        }
      })
      .from(friendships)
      .leftJoin(users, eq(friendships.senderId, users.id))
      .where(and(
        eq(friendships.receiverId, userId),
        eq(friendships.status, "pending")
      ))
      .orderBy(desc(friendships.createdAt));
    
    return results as any;
  }

  async getSentFriendRequests(userId: string): Promise<Friendship[]> {
    return await db
      .select()
      .from(friendships)
      .where(and(
        eq(friendships.senderId, userId),
        eq(friendships.status, "pending")
      ))
      .orderBy(desc(friendships.createdAt));
  }

  // Social operations - Posts
  async createPost(post: InsertSocialPost): Promise<SocialPost> {
    const [newPost] = await db
      .insert(socialPosts)
      .values(post)
      .returning();
    return newPost;
  }

  async getPosts(userId?: string, visibility?: string): Promise<SocialPost[]> {
    let query = db.select().from(socialPosts);
    
    if (userId && visibility) {
      query = query.where(and(
        eq(socialPosts.authorId, userId),
        eq(socialPosts.visibility, visibility)
      ));
    } else if (userId) {
      query = query.where(eq(socialPosts.authorId, userId));
    } else if (visibility) {
      query = query.where(eq(socialPosts.visibility, visibility));
    }
    
    return await query.orderBy(desc(socialPosts.createdAt));
  }

  async getUserPosts(userId: string): Promise<SocialPost[]> {
    return await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.authorId, userId))
      .orderBy(desc(socialPosts.createdAt));
  }

  async likePost(userId: string, postId: number): Promise<PostLike> {
    const [like] = await db
      .insert(postLikes)
      .values({ userId, postId })
      .returning();
    
    // Update likes count
    await db
      .update(socialPosts)
      .set({ 
        likesCount: sql`${socialPosts.likesCount} + 1` 
      })
      .where(eq(socialPosts.id, postId));
    
    return like;
  }

  async unlikePost(userId: string, postId: number): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(
        eq(postLikes.userId, userId),
        eq(postLikes.postId, postId)
      ));
    
    // Update likes count
    await db
      .update(socialPosts)
      .set({ 
        likesCount: sql`${socialPosts.likesCount} - 1` 
      })
      .where(eq(socialPosts.id, postId));
  }

  async commentOnPost(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db
      .insert(postComments)
      .values(comment)
      .returning();
    
    // Update comments count
    await db
      .update(socialPosts)
      .set({ 
        commentsCount: sql`${socialPosts.commentsCount} + 1` 
      })
      .where(eq(socialPosts.id, comment.postId));
    
    return newComment;
  }

  async getPostComments(postId: number): Promise<PostComment[]> {
    return await db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
  }

  async deletePost(postId: number, userId: string): Promise<void> {
    await db
      .delete(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.authorId, userId)
      ));
  }

  // Social operations - Messages
  async sendMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [newMessage] = await db
      .insert(privateMessages)
      .values(message)
      .returning();
    
    // Update or create conversation - ensure participant order consistency
    const [smaller, larger] = [message.senderId, message.receiverId].sort();
    
    try {
      await db
        .insert(conversations)
        .values({
          participant1Id: smaller,
          participant2Id: larger,
          lastMessageId: newMessage.id,
          lastActivityAt: new Date()
        });
    } catch (error) {
      // If conversation exists, update it
      await db
        .update(conversations)
        .set({
          lastMessageId: newMessage.id,
          lastActivityAt: new Date()
        })
        .where(and(
          eq(conversations.participant1Id, smaller),
          eq(conversations.participant2Id, larger)
        ));
    }
    
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]> {
    return await db
      .select()
      .from(privateMessages)
      .where(or(
        and(
          eq(privateMessages.senderId, userId1),
          eq(privateMessages.receiverId, userId2)
        ),
        and(
          eq(privateMessages.senderId, userId2),
          eq(privateMessages.receiverId, userId1)
        )
      ))
      .orderBy(privateMessages.createdAt);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    // Get all messages for the user
    const messages = await db
      .select()
      .from(privateMessages)
      .where(or(
        eq(privateMessages.senderId, userId),
        eq(privateMessages.receiverId, userId)
      ))
      .orderBy(desc(privateMessages.createdAt));

    // Group by conversation participants
    const conversationMap = new Map();
    
    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const conversationKey = [userId, otherUserId].sort().join('-');
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          participant1Id: userId < otherUserId ? userId : otherUserId,
          participant2Id: userId < otherUserId ? otherUserId : userId,
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          otherUserId: otherUserId
        });
      }
    }

    // Get participant details
    const conversations = [];
    let id = 1;
    
    for (const [key, conv] of conversationMap) {
      try {
        const participant = await this.getUser(conv.otherUserId);
        if (participant) {
          conversations.push({
            id: id++,
            participant1Id: conv.participant1Id,
            participant2Id: conv.participant2Id,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt,
            unreadCount: 0,
            participant: {
              id: participant.id,
              firstName: participant.firstName,
              lastName: participant.lastName,
              email: participant.email,
              profileImageUrl: participant.profileImageUrl,
            }
          });
        }
      } catch (error) {
        console.error('Error getting participant:', error);
      }
    }

    return conversations.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  async markMessageAsRead(messageId: number, userId?: string): Promise<void> {
    await db
      .update(privateMessages)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(privateMessages.id, messageId));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(privateMessages)
      .where(and(
        eq(privateMessages.receiverId, userId),
        eq(privateMessages.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }

  // Social operations - Calls
  async initiateCall(call: InsertCallSession): Promise<CallSession> {
    const [newCall] = await db
      .insert(callSessions)
      .values(call)
      .returning();
    return newCall;
  }

  async updateCallStatus(callId: number, status: string, duration?: number): Promise<CallSession> {
    const updateData: any = { status };
    
    if (status === "active" && !duration) {
      updateData.startedAt = new Date();
    } else if (status === "ended" && duration) {
      updateData.endedAt = new Date();
      updateData.duration = duration;
    }
    
    const [updatedCall] = await db
      .update(callSessions)
      .set(updateData)
      .where(eq(callSessions.id, callId))
      .returning();
    
    return updatedCall;
  }

  async getUserCallHistory(userId: string): Promise<CallSession[]> {
    return await db
      .select()
      .from(callSessions)
      .where(or(
        eq(callSessions.callerId, userId),
        eq(callSessions.receiverId, userId)
      ))
      .orderBy(desc(callSessions.createdAt));
  }

  // Social operations - Notifications
  async createNotification(notification: InsertNotificationTable): Promise<NotificationTable> {
    const [newNotification] = await db
      .insert(notificationsTable)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<NotificationTable[]> {
    return await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, notificationId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationsTable)
      .where(and(
        eq(notificationsTable.userId, userId),
        eq(notificationsTable.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
  }

  // Search operations
  async searchUsers(query: string, excludeUserId?: string): Promise<User[]> {
    let searchQuery = db.select().from(users);
    
    // If query is provided, filter by name or email
    if (query && query.trim().length > 0) {
      searchQuery = searchQuery.where(or(
        like(users.firstName, `%${query}%`),
        like(users.lastName, `%${query}%`),
        like(users.email, `%${query}%`)
      ));
    }
    
    // Exclude current user
    if (excludeUserId) {
      searchQuery = searchQuery.where(ne(users.id, excludeUserId));
    }
    
    return await searchQuery.limit(20);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.senderId, userId), eq(friendships.receiverId, friendId)),
          and(eq(friendships.senderId, friendId), eq(friendships.receiverId, userId))
        )
      );
  }

  // Message reactions operations
  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const [newReaction] = await db
      .insert(messageReactions)
      .values(reaction)
      .onConflictDoUpdate({
        target: [messageReactions.messageId, messageReactions.userId, messageReactions.emoji],
        set: {
          createdAt: new Date()
        }
      })
      .returning();
    
    return newReaction;
  }

  async removeMessageReaction(messageId: number, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(messageReactions.createdAt);
  }
}

export const storage = new DatabaseStorage();

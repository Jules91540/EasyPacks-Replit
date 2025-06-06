import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For local authentication
  authProvider: varchar("auth_provider").default('local'), // 'local', 'google', etc.
  role: varchar("role").notNull().default("student"), // student or admin
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  emailPreferences: jsonb("email_preferences").default('{"marketing": false, "notifications": true, "weeklyDigest": true}'),
  privacySettings: jsonb("privacy_settings").default('{"profileVisible": true, "showBadges": true, "showProgress": false}'),
  lastPasswordChange: timestamp("last_password_change"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email logs table
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(), // 'welcome', 'password_change', 'notification', etc.
  recipient: varchar("recipient").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  status: varchar("status").notNull().default("sent"), // 'sent', 'failed', 'pending'
  sentAt: timestamp("sent_at").defaultNow(),
});

// Training modules
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: varchar("video_url"),
  downloadFiles: text("download_files").array(),
  order: integer("order").notNull(),
  xpReward: integer("xp_reward").notNull().default(100),
  platform: varchar("platform"), // twitch, youtube, instagram, tiktok, twitter
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id),
  title: varchar("title").notNull(),
  questions: jsonb("questions").notNull(), // Array of question objects
  xpReward: integer("xp_reward").notNull().default(50),
  passingScore: integer("passing_score").notNull().default(70),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress on modules
export const moduleProgress = pgTable("module_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  status: varchar("status").notNull().default("not_started"), // not_started, in_progress, completed
  progress: integer("progress").notNull().default(0), // percentage 0-100
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  score: integer("score").notNull(),
  answers: jsonb("answers").notNull(),
  passed: boolean("passed").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Badges
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  requirements: jsonb("requirements").notNull(), // Conditions to earn badge
  xpReward: integer("xp_reward").notNull().default(25),
  createdAt: timestamp("created_at").defaultNow(),
});

// User badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Simulations usage tracking
export const simulationUsage = pgTable("simulation_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  simulationType: varchar("simulation_type").notNull(), // thumbnail_creator, post_scheduler, etc.
  usedAt: timestamp("used_at").defaultNow(),
});

// Forum system
export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3B82F6"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const forumTopics = pgTable("forum_topics", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => forumTopics.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forumReactions = pgTable("forum_reactions", {
  id: serial("id").primaryKey(),
  messageId: varchar("message_id").notNull(), // peut être topic ou reply ID
  messageType: varchar("message_type").notNull(), // "topic" ou "reply"
  userId: varchar("user_id").notNull().references(() => users.id),
  emoji: varchar("emoji").notNull(), // "❤️", "👍", "😂", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Features Tables
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, accepted, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  visibility: varchar("visibility").notNull().default("public"), // public, friends, private
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  sharesCount: integer("shares_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => socialPosts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => socialPosts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type").notNull().default("text"), // text, image, file, call_invite
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const typingStatus = pgTable("typing_status", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  isTyping: boolean("is_typing").notNull().default(false),
  lastTypingAt: timestamp("last_typing_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  lastMessageId: integer("last_message_id").references(() => privateMessages.id),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const callSessions = pgTable("call_sessions", {
  id: serial("id").primaryKey(),
  callerId: varchar("caller_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  status: varchar("status").notNull().default("initiated"), // initiated, ringing, active, ended, missed
  callType: varchar("call_type").notNull().default("voice"), // voice, video
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsTable = pgTable("notifications_table", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // friend_request, message, call, post_like, post_comment
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  relatedUserId: varchar("related_user_id").references(() => users.id),
  relatedPostId: integer("related_post_id").references(() => socialPosts.id),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => privateMessages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  emoji: varchar("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueReaction: unique("unique_message_user_emoji").on(table.messageId, table.userId, table.emoji),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  moduleProgress: many(moduleProgress),
  quizAttempts: many(quizAttempts),
  userBadges: many(userBadges),
  simulationUsage: many(simulationUsage),
  forumTopics: many(forumTopics),
  forumReplies: many(forumReplies),
  emailLogs: many(emailLogs),
  sentFriendRequests: many(friendships, { relationName: "sender" }),
  receivedFriendRequests: many(friendships, { relationName: "receiver" }),
  socialPosts: many(socialPosts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  sentMessages: many(privateMessages, { relationName: "sender" }),
  receivedMessages: many(privateMessages, { relationName: "receiver" }),
  initiatedCalls: many(callSessions, { relationName: "caller" }),
  receivedCalls: many(callSessions, { relationName: "receiver" }),
  notifications: many(notificationsTable),
  messageReactions: many(messageReactions),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  sender: one(users, {
    fields: [friendships.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [friendships.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [socialPosts.authorId],
    references: [users.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
  post: one(socialPosts, {
    fields: [postLikes.postId],
    references: [socialPosts.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
  post: one(socialPosts, {
    fields: [postComments.postId],
    references: [socialPosts.id],
  }),
}));

export const privateMessagesRelations = relations(privateMessages, ({ one, many }) => ({
  sender: one(users, {
    fields: [privateMessages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [privateMessages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  reactions: many(messageReactions),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
    relationName: "participant1",
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
    relationName: "participant2",
  }),
  lastMessage: one(privateMessages, {
    fields: [conversations.lastMessageId],
    references: [privateMessages.id],
  }),
}));

export const callSessionsRelations = relations(callSessions, ({ one }) => ({
  caller: one(users, {
    fields: [callSessions.callerId],
    references: [users.id],
    relationName: "caller",
  }),
  receiver: one(users, {
    fields: [callSessions.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const notificationsTableRelations = relations(notificationsTable, ({ one }) => ({
  user: one(users, {
    fields: [notificationsTable.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notificationsTable.relatedUserId],
    references: [users.id],
  }),
  relatedPost: one(socialPosts, {
    fields: [notificationsTable.relatedPostId],
    references: [socialPosts.id],
  }),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(privateMessages, {
    fields: [messageReactions.messageId],
    references: [privateMessages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  quizzes: many(quizzes),
  moduleProgress: many(moduleProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(modules, {
    fields: [quizzes.moduleId],
    references: [modules.id],
  }),
  attempts: many(quizAttempts),
}));

export const moduleProgressRelations = relations(moduleProgress, ({ one }) => ({
  user: one(users, {
    fields: [moduleProgress.userId],
    references: [users.id],
  }),
  module: one(modules, {
    fields: [moduleProgress.moduleId],
    references: [modules.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const forumCategoriesRelations = relations(forumCategories, ({ many }) => ({
  topics: many(forumTopics),
}));

export const forumTopicsRelations = relations(forumTopics, ({ one, many }) => ({
  category: one(forumCategories, {
    fields: [forumTopics.categoryId],
    references: [forumCategories.id],
  }),
  author: one(users, {
    fields: [forumTopics.authorId],
    references: [users.id],
  }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  topic: one(forumTopics, {
    fields: [forumReplies.topicId],
    references: [forumTopics.id],
  }),
  author: one(users, {
    fields: [forumReplies.authorId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;
export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = typeof moduleProgress.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type SimulationUsage = typeof simulationUsage.$inferSelect;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = typeof forumCategories.$inferInsert;
export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = typeof forumTopics.$inferInsert;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;
export type ForumReaction = typeof forumReactions.$inferSelect;
export type InsertForumReaction = typeof forumReactions.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// Social types
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = typeof privateMessages.$inferInsert;
export type TypingStatus = typeof typingStatus.$inferSelect;
export type InsertTypingStatus = typeof typingStatus.$inferInsert;
export type ConversationDb = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type CallSession = typeof callSessions.$inferSelect;
export type InsertCallSession = typeof callSessions.$inferInsert;
export type NotificationTable = typeof notificationsTable.$inferSelect;
export type InsertNotificationTable = typeof notificationsTable.$inferInsert;

// Custom conversation type with participant info
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

export type ConversationWithParticipant = {
  id: number;
  participant1Id: string;
  participant2Id: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  participant: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
};

// Zod schemas
export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModuleProgressSchema = createInsertSchema(moduleProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

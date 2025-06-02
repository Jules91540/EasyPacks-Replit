import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { 
  insertModuleSchema, 
  insertQuizSchema, 
  insertModuleProgressSchema,
  insertQuizAttemptSchema,
  insertBadgeSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store persistent data for reactions and notifications
let messageReactions: Record<string, Record<string, string[]>> = {};
let userNotifications: Record<string, any[]> = {};

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'));
    }
  }
});

// Temporary storage for forum topics and replies (in production, this would be in database)
const forumTopics: any[] = [];
const forumReplies: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // PRIORITY ROUTE - Discover users (must be first to avoid conflicts)
  app.get("/api/users/discover", async (req: any, res) => {
    console.log("=== DISCOVER USERS ROUTE HIT ===");
    
    try {
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      
      const allUsers = await db.select().from(users);
      console.log("Found users in database:", allUsers.length);
      
      const usersWithStats = allUsers.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        level: user.level || 1,
        xp: user.xp || 0,
        stats: {
          completedModules: Math.floor(Math.random() * 5),
          totalBadges: Math.floor(Math.random() * 3),
          totalXP: user.xp || Math.floor(Math.random() * 1000),
          level: user.level || 1
        }
      }));
      
      console.log("Returning users:", usersWithStats.length);
      res.json(usersWithStats);
    } catch (error) {
      console.error("Discover route error:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For the new auth system, user is stored directly in req.user
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Module routes
  app.get("/api/modules", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const modules = user?.role === 'admin' 
        ? await storage.getModules()
        : await storage.getPublishedModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post("/api/modules", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      const moduleData = insertModuleSchema.partial().parse(req.body);
      const module = await storage.updateModule(moduleId, moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleId = parseInt(req.params.id);
      await storage.deleteModule(moduleId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Quiz routes
  app.get("/api/modules/:moduleId/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const quizzes = await storage.getQuizzesByModule(moduleId);
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get("/api/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  // Progress routes
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getUserModuleProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progressData = insertModuleProgressSchema.parse({
        ...req.body,
        userId
      });
      
      const progress = await storage.updateModuleProgress(progressData);
      
      // Award XP if module completed
      if (progressData.status === 'completed') {
        const module = await storage.getModule(progressData.moduleId);
        if (module) {
          await storage.updateUserXP(userId, module.xpReward);
        }
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Quiz attempt routes
  app.post("/api/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const attemptData = insertQuizAttemptSchema.parse({
        ...req.body,
        userId
      });

      const attempt = await storage.createQuizAttempt(attemptData);
      
      // Award XP for quiz completion
      if (attempt.passed) {
        const quiz = await storage.getQuiz(attempt.quizId);
        if (quiz) {
          await storage.updateUserXP(userId, quiz.xpReward);
        }
      }
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      res.status(500).json({ message: "Failed to create quiz attempt" });
    }
  });

  app.get("/api/quiz-attempts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const attempts = await storage.getUserQuizAttempts(userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  // Badge routes
  app.get("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/user-badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Simulation routes
  app.post("/api/simulations/:type/use", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const simulationType = req.params.type;
      
      const usage = await storage.recordSimulationUsage(userId, simulationType);
      
      // Award XP for simulation usage
      await storage.updateUserXP(userId, 50);
      
      res.status(201).json(usage);
    } catch (error) {
      console.error("Error recording simulation usage:", error);
      res.status(500).json({ message: "Failed to record simulation usage" });
    }
  });

  // Profile settings routes
  app.post("/api/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mot de passe actuel et nouveau mot de passe requis" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await storage.verifyPassword(userId, currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }
      
      // Hash new password
      const bcrypt = await import('bcrypt');
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await storage.updatePassword(userId, newPasswordHash);
      
      // Send notification email
      const user = await storage.getUser(userId);
      if (user && user.email && user.firstName) {
        try {
          const { EmailService } = await import('./email');
          await EmailService.sendPasswordChangeEmail({
            id: user.id,
            email: user.email,
            firstName: user.firstName
          });
          console.log(`✅ Email de changement de mot de passe envoyé à ${user.email}`);
        } catch (emailError) {
          console.error('Erreur envoi email de changement de mot de passe:', emailError);
        }
      }
      
      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erreur lors du changement de mot de passe" });
    }
  });

  app.patch("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const { marketing, notifications, weeklyDigest } = req.body;
      const userId = req.user.id;
      
      const preferences = { marketing, notifications, weeklyDigest };
      await storage.updateEmailPreferences(userId, preferences);
      
      res.json({ 
        message: "Préférences email mises à jour",
        preferences
      });
    } catch (error) {
      console.error("Error updating email preferences:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des préférences" });
    }
  });

  app.patch("/api/privacy-settings", isAuthenticated, async (req: any, res) => {
    try {
      const { profileVisible, showBadges, showProgress } = req.body;
      const userId = req.user.id;
      
      const settings = { profileVisible, showBadges, showProgress };
      await storage.updatePrivacySettings(userId, settings);
      
      res.json({ 
        message: "Paramètres de confidentialité mis à jour",
        settings
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des paramètres" });
    }
  });

  // Forum routes
  app.get("/api/forum/categories", isAuthenticated, async (req: any, res) => {
    try {
      // Get topics by category
      const getTopicsByCategory = (categoryId: number) => {
        return forumTopics
          .filter(topic => topic.categoryId === categoryId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(topic => ({
            ...topic,
            author: { firstName: 'Utilisateur' }, // Simplified for demo
            repliesCount: 0
          }));
      };

      const categories = [
        {
          id: 1,
          name: "Création de contenu YouTube",
          description: "Discutez de vos stratégies, conseils et expériences sur YouTube",
          color: "#FF0000",
          topicsCount: forumTopics.filter(t => t.categoryId === 1).length,
          latestTopics: getTopicsByCategory(1)
        },
        {
          id: 2,
          name: "Instagram & Réseaux sociaux",
          description: "Partagez vos astuces pour Instagram, TikTok et autres plateformes",
          color: "#E4405F",
          topicsCount: forumTopics.filter(t => t.categoryId === 2).length,
          latestTopics: getTopicsByCategory(2)
        },
        {
          id: 3,
          name: "Streaming Twitch",
          description: "Conseils et discussions sur le streaming en direct",
          color: "#9146FF",
          topicsCount: forumTopics.filter(t => t.categoryId === 3).length,
          latestTopics: getTopicsByCategory(3)
        },
        {
          id: 4,
          name: "Questions générales",
          description: "Posez vos questions sur la création de contenu",
          color: "#00D2FF",
          topicsCount: forumTopics.filter(t => t.categoryId === 4).length,
          latestTopics: getTopicsByCategory(4)
        }
      ];
      res.json(categories);
    } catch (error) {
      console.error("Error fetching forum categories:", error);
      res.status(500).json({ message: "Erreur lors du chargement des catégories" });
    }
  });

  // Create forum topic
  app.post("/api/forum/topics", isAuthenticated, async (req: any, res) => {
    try {
      const { title, content, categoryId } = req.body;
      const userId = req.user.id;

      if (!title || !content || !categoryId) {
        return res.status(400).json({ message: "Titre, contenu et catégorie requis" });
      }

      // Store topic in memory (in production, this would be in database)
      const topic = {
        id: Date.now(),
        title,
        content,
        categoryId: parseInt(categoryId),
        authorId: userId,
        createdAt: new Date(),
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        repliesCount: 0
      };

      forumTopics.push(topic);
      res.json(topic);
    } catch (error) {
      console.error("Error creating forum topic:", error);
      res.status(500).json({ message: "Erreur lors de la création du sujet" });
    }
  });

  // Get single topic
  app.get("/api/forum/topics/:id", isAuthenticated, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const userId = req.user.id;
      const topic = forumTopics.find(t => t.id === topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Sujet introuvable" });
      }

      // Supprimer les notifications liées à ce topic pour cet utilisateur
      if (userNotifications[userId]) {
        userNotifications[userId] = userNotifications[userId].filter(notification => 
          !(notification.type === 'forum_mention' && notification.topicId === topicId) &&
          !(notification.type === 'forum_reply' && notification.topicId === topicId)
        );
      }

      // Increment view count
      topic.viewCount = (topic.viewCount || 0) + 1;

      // Get real author info from database
      const author = await storage.getUser(topic.authorId);

      // Add author info
      const enrichedTopic = {
        ...topic,
        author: {
          firstName: author?.firstName || 'Utilisateur',
          lastName: author?.lastName || '',
          email: author?.email || '',
          profileImageUrl: author?.profileImageUrl || ''
        }
      };

      res.json(enrichedTopic);
    } catch (error) {
      console.error("Error fetching forum topic:", error);
      res.status(500).json({ message: "Erreur lors du chargement du sujet" });
    }
  });

  // Get topic replies
  app.get("/api/forum/topics/:id/replies", isAuthenticated, async (req: any, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const replies = forumReplies
        .filter(r => r.topicId === topicId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Enrich replies with real author info
      const enrichedReplies = await Promise.all(
        replies.map(async (reply) => {
          const author = await storage.getUser(reply.authorId);
          return {
            ...reply,
            author: {
              firstName: author?.firstName || 'Utilisateur',
              lastName: author?.lastName || '',
              email: author?.email || '',
              profileImageUrl: author?.profileImageUrl || ''
            }
          };
        })
      );

      res.json(enrichedReplies);
    } catch (error) {
      console.error("Error fetching forum replies:", error);
      res.status(500).json({ message: "Erreur lors du chargement des réponses" });
    }
  });

  // Get users for mentions
  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      console.log("User search query:", query);
      
      if (!query || query.length < 1) {
        return res.json([]);
      }

      // Utiliser les vrais utilisateurs authentifiés
      const currentUserId = req.user.id;
      
      // Récupérer les utilisateurs connus
      const knownUsers = [
        { id: "43311594", firstName: "Easy", lastName: "Packs", email: "easy.packs0@gmail.com" },
        { id: "109791419912459995702", firstName: "Gameli", lastName: "SENYO", email: "gamelisenyo@gmail.com" },
        { id: "105806234081112158042", firstName: "Julien", lastName: "Pariès", email: "julparinova@gmail.com" }
      ];

      // Ajouter l'utilisateur actuel s'il n'est pas déjà dans la liste
      const currentUser = await storage.getUser(currentUserId);
      if (currentUser && !knownUsers.find(u => u.id === currentUser.id)) {
        knownUsers.push({
          id: currentUser.id,
          firstName: currentUser.firstName || "Utilisateur",
          lastName: currentUser.lastName || "",
          email: currentUser.email || ""
        });
      }

      // Filtrer avec une recherche plus permissive
      const filteredUsers = knownUsers
        .filter(user => user.id !== currentUserId) // Exclure l'utilisateur actuel
        .filter(user => 
          user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName.toLowerCase().includes(query.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())
        );

      res.json(filteredUsers.slice(0, 5)); // Limiter à 5 résultats
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Erreur lors de la recherche d'utilisateurs" });
    }
  });

  // Get user profile by ID
  app.get("/api/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      // Remove email from response for privacy
      const { email, ...userWithoutEmail } = user;
      res.json(userWithoutEmail);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du profil" });
    }
  });

  // Get user progress by ID
  app.get("/api/users/:userId/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const progress = await storage.getUserModuleProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du progrès" });
    }
  });

  // Get user badges by ID
  app.get("/api/users/:userId/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des badges" });
    }
  });

  // Get reactions for a message
  app.get("/api/forum/reactions/:messageId", isAuthenticated, async (req: any, res) => {
    try {
      const messageId = req.params.messageId;
      const userId = req.user.id;
      
      // Gérer les réactions de manière persistante
      if (!messageReactions[messageId]) {
        messageReactions[messageId] = {};
      }
      
      const reactions = Object.keys(messageReactions[messageId]).map(emoji => {
        const userList = messageReactions[messageId][emoji];
        return {
          emoji,
          count: userList.length,
          userReacted: userList.includes(userId)
        };
      });
      
      // Ajouter les réactions par défaut si aucune réaction existe
      if (reactions.length === 0) {
        reactions.push(
          { emoji: "❤️", count: 0, userReacted: false },
          { emoji: "👍", count: 0, userReacted: false },
          { emoji: "😂", count: 0, userReacted: false }
        );
      }

      res.json(reactions);
    } catch (error) {
      console.error("Error fetching reactions:", error);
      res.status(500).json({ message: "Erreur lors du chargement des réactions" });
    }
  });

  // Add or remove reaction
  app.post("/api/forum/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const { messageId, messageType, emoji } = req.body;
      const userId = req.user.id;

      // Initialiser les réactions pour ce message si elles n'existent pas
      if (!messageReactions[messageId]) {
        messageReactions[messageId] = {};
      }
      
      // Initialiser l'emoji si il n'existe pas
      if (!messageReactions[messageId][emoji]) {
        messageReactions[messageId][emoji] = [];
      }
      
      const userIndex = messageReactions[messageId][emoji].indexOf(userId);
      let reactionAdded = false;
      
      if (userIndex === -1) {
        // Ajouter la réaction
        messageReactions[messageId][emoji].push(userId);
        reactionAdded = true;
      } else {
        // Supprimer la réaction
        messageReactions[messageId][emoji].splice(userIndex, 1);
        reactionAdded = false;
      }
      
      res.json({ 
        success: true, 
        action: reactionAdded ? "added" : "removed",
        emoji,
        messageId 
      });
    } catch (error) {
      console.error("Error managing reaction:", error);
      res.status(500).json({ message: "Erreur lors de la gestion de la réaction" });
    }
  });

  // Detect mentions in content and send notifications
  const detectMentionsAndNotify = async (content: string, authorId: string, topicId: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1];
      // Chercher l'utilisateur par prénom
      const allUsers = [
        { id: "43311594", firstName: "Easy", lastName: "Packs", email: "easy.packs0@gmail.com" },
        { id: "109791419912459995702", firstName: "Gameli", lastName: "SENYO", email: "gamelisenyo@gmail.com" }
      ];
      
      const mentionedUser = allUsers.find(user => 
        user.firstName.toLowerCase() === mentionedName.toLowerCase()
      );
      
      if (mentionedUser && mentionedUser.id !== authorId) {
        mentions.push({
          userId: mentionedUser.id,
          userName: mentionedUser.firstName,
          content: content,
          topicId: topicId
        });
      }
    }
    
    return mentions;
  };

  // Create forum reply with file upload
  app.post("/api/forum/replies", isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const { content, topicId } = req.body;
      const userId = req.user.id;
      const files = req.files || [];

      if (!content || !topicId) {
        return res.status(400).json({ message: "Contenu et sujet requis" });
      }

      // Process uploaded files
      const attachments = files.map((file: any) => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: `/uploads/${file.filename}`,
        filename: file.originalname
      }));

      const reply = {
        id: Date.now(),
        content,
        topicId: parseInt(topicId),
        authorId: userId,
        createdAt: new Date(),
        attachments
      };

      forumReplies.push(reply);

      // Récupérer les informations de l'utilisateur qui poste
      const currentUser = await storage.getUser(userId);
      
      // Détecter les mentions et créer des notifications ciblées
      const mentions = await detectMentionsAndNotify(content, userId, topicId);
      
      // Créer des notifications pour les utilisateurs mentionnés
      for (const mention of mentions) {
        if (!userNotifications[mention.userId]) {
          userNotifications[mention.userId] = [];
        }
        userNotifications[mention.userId].push({
          id: Date.now() + Math.random(),
          type: 'mention',
          message: `${currentUser?.firstName || 'Un utilisateur'} vous a mentionné dans le forum`,
          content: mention.content,
          topicId: mention.topicId,
          authorName: currentUser?.firstName || 'Utilisateur',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Update topic reply count
      const topic = forumTopics.find(t => t.id === parseInt(topicId));
      if (topic) {
        topic.repliesCount = (topic.repliesCount || 0) + 1;
        
        // Create notification for topic author if different from reply author
        if (topic.authorId !== userId) {
          if (!userNotifications[topic.authorId]) {
            userNotifications[topic.authorId] = [];
          }
          userNotifications[topic.authorId].push({
            id: Date.now(),
            type: 'forum_reply',
            message: `Nouvelle réponse sur votre sujet "${topic.title}"`,
            topicId: topic.id,
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      res.json(reply);
    } catch (error) {
      console.error("Error creating forum reply:", error);
      res.status(500).json({ message: "Erreur lors de la création de la réponse" });
    }
  });

  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = userNotifications[userId] || [];
      const unreadCount = notifications.filter(n => !n.isRead).length;
      
      res.json({ 
        notifications: notifications.slice(-10), // Last 10 notifications
        unreadCount 
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Erreur lors du chargement des notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      if (userNotifications[userId]) {
        const notification = userNotifications[userId].find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  // Test email route - mode simulation
  app.post("/api/test-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "Utilisateur ou email introuvable" });
      }

      console.log(`📧 Tentative d'envoi d'email à ${user.email}`);
      console.log(`Sujet: 📢 Test du système d'emails`);

      const { EmailService } = await import('./email');
      const success = await EmailService.sendEmail(
        'notification',
        user.email,
        {
          firstName: user.firstName || 'Utilisateur',
          title: 'Test du système d\'emails',
          message: 'Ceci est un email de test pour vérifier que le système fonctionne correctement.'
        },
        user.id
      );

      if (success) {
        res.json({ message: "Email de test envoyé avec succès" });
      } else {
        res.status(500).json({ message: "Échec de l'envoi de l'email de test" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi de l'email de test" });
    }
  });

  // Admin stats routes
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getStudentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin user management - Delete all non-admin users
  app.delete("/api/admin/users/non-admin", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deletedCount = await storage.deleteNonAdminUsers();
      res.json({ 
        message: `${deletedCount} comptes non-administrateurs supprimés avec succès`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error deleting non-admin users:", error);
      res.status(500).json({ message: "Erreur lors de la suppression des comptes utilisateurs" });
    }
  });

  // Admin module management routes
  app.get("/api/admin/modules", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/admin/modules", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const moduleData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.patch("/api/admin/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updateData = req.body;
      const module = await storage.updateModule(id, updateData);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/admin/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteModule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Admin quiz management routes
  app.get("/api/admin/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const modules = await storage.getModules();
      const allQuizzes = [];
      for (const module of modules) {
        const quizzes = await storage.getQuizzesByModule(module.id);
        allQuizzes.push(...quizzes);
      }
      res.json(allQuizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/admin/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.patch("/api/admin/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updateData = req.body;
      const quiz = await storage.updateQuiz(id, updateData);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete("/api/admin/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteQuiz(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Admin badge management routes
  app.get("/api/admin/badges", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/admin/badges", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const badgeData = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(badgeData);
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.patch("/api/admin/badges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // For now, we'll simulate updating badges since the storage interface doesn't have updateBadge
      // In a real implementation, you'd add this method to the storage interface
      res.json({ id, ...updateData });
    } catch (error) {
      console.error("Error updating badge:", error);
      res.status(500).json({ message: "Failed to update badge" });
    }
  });

  app.delete("/api/admin/badges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      // For now, we'll simulate deleting badges since the storage interface doesn't have deleteBadge
      // In a real implementation, you'd add this method to the storage interface
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting badge:", error);
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });

  // Profile photo upload route with better error handling
  app.post("/api/profile/upload-photo", isAuthenticated, (req: any, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "Le fichier est trop volumineux. Taille maximum: 20MB" 
          });
        }
        if (err.message === 'Seuls les fichiers image sont autorisés') {
          return res.status(400).json({ 
            message: "Seuls les fichiers image sont autorisés" 
          });
        }
        return res.status(400).json({ 
          message: "Erreur lors de l'upload: " + err.message 
        });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier téléchargé" });
      }

      const userId = req.user.id;
      const photoUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image URL
      const updatedUser = await storage.upsertUser({
        id: userId,
        profileImageUrl: photoUrl,
      });
      
      res.json({ photoUrl, user: updatedUser });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Échec du téléchargement de la photo" });
    }
  });

  // Profile update route
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Only allow updating specific fields
      const allowedFields = ['firstName', 'lastName', 'profileImageUrl'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.upsertUser({
        id: userId,
        ...filteredData,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Social Features Routes

  // Friends routes
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user?.claims?.sub || req.user?.id;
      
      console.log("=== FRIEND REQUEST DEBUG ===");
      console.log("User object:", req.user);
      console.log("Sender ID:", senderId);
      console.log("Receiver ID:", receiverId);
      
      if (!senderId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const friendship = await storage.sendFriendRequest(senderId, receiverId);
      
      // Create notification
      await storage.createNotification({
        userId: receiverId,
        type: "friend_request",
        title: "Nouvelle demande d'ami",
        content: `${req.user.claims?.first_name || req.user.firstName || 'Un utilisateur'} vous a envoyé une demande d'ami`,
        relatedUserId: senderId
      });
      
      console.log("=== FRIEND REQUEST SUCCESS ===");
      console.log("Friendship created:", friendship);
      
      res.json({ ...friendship, message: "Demande d'ami envoyée avec succès!" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put("/api/friends/accept/:id", isAuthenticated, async (req: any, res) => {
    try {
      const friendshipId = parseInt(req.params.id);
      const friendship = await storage.acceptFriendRequest(friendshipId);
      res.json(friendship);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.delete("/api/friends/reject/:id", isAuthenticated, async (req: any, res) => {
    try {
      const friendshipId = parseInt(req.params.id);
      await storage.rejectFriendRequest(friendshipId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.delete("/api/friends/remove/:friendId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { friendId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      await storage.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  app.get("/api/friends/requests/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Posts routes
  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { content, imageUrl, visibility = "public" } = req.body;
      const authorId = req.user.claims.sub;
      
      const post = await storage.createPost({
        authorId,
        content,
        imageUrl,
        visibility
      });
      
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, visibility } = req.query;
      const posts = await storage.getPosts(userId, visibility);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const like = await storage.likePost(userId, postId);
      res.json(like);
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      await storage.unlikePost(userId, postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post("/api/posts/:id/comment", isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      const userId = req.user.claims.sub;
      
      const comment = await storage.commentOnPost({
        userId,
        postId,
        content
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Error commenting on post:", error);
      res.status(500).json({ message: "Failed to comment on post" });
    }
  });

  app.get("/api/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Messages routes
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { receiverId, content, messageType = "text" } = req.body;
      const senderId = req.user?.id;
      
      const message = await storage.sendMessage({
        senderId,
        receiverId,
        content,
        messageType
      });
      
      // Create notification
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        title: "Nouveau message",
        content: `${req.user?.firstName || 'Un utilisateur'} vous a envoyé un message`,
        relatedUserId: senderId
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });





  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user?.id;
      const otherUserId = req.params.userId;
      
      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.get("/api/messages/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadMessageCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Calls routes
  app.post("/api/calls", isAuthenticated, async (req: any, res) => {
    try {
      const { receiverId, callType = "voice" } = req.body;
      const callerId = req.user.id;
      
      const call = await storage.initiateCall({
        callerId,
        receiverId,
        callType,
        status: "initiated"
      });
      
      // Create notification
      await storage.createNotification({
        userId: receiverId,
        type: "call",
        title: "Appel entrant",
        content: `${req.user?.firstName || 'Un utilisateur'} vous appelle`,
        relatedUserId: callerId
      });
      
      res.json(call);
    } catch (error) {
      console.error("Error initiating call:", error);
      res.status(500).json({ message: "Failed to initiate call" });
    }
  });

  app.put("/api/calls/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const callId = parseInt(req.params.id);
      const { status, duration } = req.body;
      
      const call = await storage.updateCallStatus(callId, status, duration);
      res.json(call);
    } catch (error) {
      console.error("Error updating call status:", error);
      res.status(500).json({ message: "Failed to update call status" });
    }
  });

  app.get("/api/calls/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserCallHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching call history:", error);
      res.status(500).json({ message: "Failed to fetch call history" });
    }
  });

  // Search routes for social features
  app.get("/api/search/users", isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!q || q.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(q, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });



  // Social notifications routes
  app.get("/api/notifications/social", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching social notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.put("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Cette fonction devra être ajoutée au storage
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

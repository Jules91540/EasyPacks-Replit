import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
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

export async function registerRoutes(app: Express): Promise<Server> {
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
      // For now, return basic categories - in a real app, these would be stored in database
      const categories = [
        {
          id: 1,
          name: "Création de contenu YouTube",
          description: "Discutez de vos stratégies, conseils et expériences sur YouTube",
          color: "#FF0000",
          topicsCount: 0,
          latestTopics: []
        },
        {
          id: 2,
          name: "Instagram & Réseaux sociaux",
          description: "Partagez vos astuces pour Instagram, TikTok et autres plateformes",
          color: "#E4405F",
          topicsCount: 0,
          latestTopics: []
        },
        {
          id: 3,
          name: "Streaming Twitch",
          description: "Conseils et discussions sur le streaming en direct",
          color: "#9146FF",
          topicsCount: 0,
          latestTopics: []
        },
        {
          id: 4,
          name: "Questions générales",
          description: "Posez vos questions sur la création de contenu",
          color: "#00D2FF",
          topicsCount: 0,
          latestTopics: []
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

      // For now, simulate topic creation since we don't have actual database storage
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

      res.json(topic);
    } catch (error) {
      console.error("Error creating forum topic:", error);
      res.status(500).json({ message: "Erreur lors de la création du sujet" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}

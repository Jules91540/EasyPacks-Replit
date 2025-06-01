import { db } from "./db";
import { users, modules, quizzes, badges } from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create admin user
    const adminUser = await db.insert(users).values({
      id: "admin_user_1",
      email: "admin@createuracademy.fr",
      firstName: "Admin",
      lastName: "Créateur Academy",
      role: "admin",
      level: 10,
      xp: 10000,
      profileImageUrl: null
    }).onConflictDoNothing().returning();

    console.log("✅ Admin user created");

    // Create sample modules
    const sampleModules = [
      {
        title: "Introduction au Streaming sur Twitch",
        description: "Apprenez les bases pour commencer votre aventure de streamer sur Twitch",
        content: "Dans ce module, vous découvrirez comment configurer votre chaîne Twitch, choisir votre équipement, et attirer vos premiers viewers.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["guide-twitch-debutant.pdf", "checklist-streaming.pdf"],
        order: 1,
        xpReward: 150,
        platform: "twitch",
        isPublished: true
      },
      {
        title: "Créer du Contenu Viral sur TikTok",
        description: "Maîtrisez l'art de créer des vidéos TikTok qui captivent et engagent",
        content: "Découvrez les tendances, les techniques de montage, et les stratégies pour faire exploser vos vues sur TikTok.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["templates-tiktok.zip", "musiques-tendances.pdf"],
        order: 2,
        xpReward: 120,
        platform: "tiktok",
        isPublished: true
      },
      {
        title: "Monétiser votre Chaîne YouTube",
        description: "Transformez votre passion en revenus avec les stratégies de monétisation YouTube",
        content: "Apprenez les différentes méthodes de monétisation, l'optimisation SEO, et la création de contenu rentable.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["guide-monetisation.pdf", "keywords-youtube.xlsx"],
        order: 3,
        xpReward: 200,
        platform: "youtube",
        isPublished: true
      },
      {
        title: "Instagram Stories et Reels Efficaces",
        description: "Créez des stories et reels Instagram qui convertissent",
        content: "Maîtrisez les outils de création, les stratégies de contenu, et l'engagement communautaire sur Instagram.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["templates-instagram.zip", "calendrier-contenu.pdf"],
        order: 4,
        xpReward: 130,
        platform: "instagram",
        isPublished: true
      },
      {
        title: "Stratégie de Contenu sur X (Twitter)",
        description: "Développez une présence influente sur X avec du contenu stratégique",
        content: "Apprenez à créer des threads viraux, optimiser votre profil, et construire une communauté engagée.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["guide-twitter.pdf", "templates-threads.docx"],
        order: 5,
        xpReward: 110,
        platform: "twitter",
        isPublished: true
      },
      {
        title: "Branding Personnel Multi-Plateformes",
        description: "Construisez une marque personnelle cohérente sur toutes les plateformes",
        content: "Découvrez comment développer votre identité visuelle, votre voice, et votre stratégie cross-platform.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        downloadFiles: ["kit-branding.zip", "charte-graphique.pdf"],
        order: 6,
        xpReward: 250,
        platform: null,
        isPublished: false
      }
    ];

    const createdModules = await db.insert(modules).values(sampleModules).returning();
    console.log("✅ Sample modules created");

    // Create quizzes for modules
    const sampleQuizzes = [
      {
        moduleId: createdModules[0].id,
        title: "Quiz : Bases de Twitch",
        questions: [
          {
            id: 1,
            question: "Quelle est la résolution recommandée pour le streaming sur Twitch ?",
            options: ["720p 30fps", "1080p 60fps", "1440p 30fps", "4K 30fps"],
            correct: 1
          },
          {
            id: 2,
            question: "Combien de temps devez-vous streamer pour être éligible à l'affiliation Twitch ?",
            options: ["2 heures", "4 heures", "7 heures", "10 heures"],
            correct: 2
          },
          {
            id: 3,
            question: "Quel est le débit minimum recommandé pour un stream de qualité ?",
            options: ["1 Mbps", "3 Mbps", "5 Mbps", "10 Mbps"],
            correct: 2
          }
        ],
        xpReward: 50,
        passingScore: 70
      },
      {
        moduleId: createdModules[1].id,
        title: "Quiz : TikTok Viral",
        questions: [
          {
            id: 1,
            question: "Quelle est la durée idéale d'une vidéo TikTok pour maximiser l'engagement ?",
            options: ["15-30 secondes", "30-60 secondes", "1-2 minutes", "2-3 minutes"],
            correct: 1
          },
          {
            id: 2,
            question: "À quel moment de la journée publier pour avoir le plus de vues ?",
            options: ["6h-9h", "12h-15h", "18h-21h", "22h-1h"],
            correct: 2
          }
        ],
        xpReward: 50,
        passingScore: 70
      },
      {
        moduleId: createdModules[2].id,
        title: "Quiz : Monétisation YouTube",
        questions: [
          {
            id: 1,
            question: "Combien d'abonnés faut-il pour activer la monétisation YouTube ?",
            options: ["100", "500", "1000", "5000"],
            correct: 2
          },
          {
            id: 2,
            question: "Combien d'heures de watch time sont nécessaires sur 12 mois ?",
            options: ["1000", "2000", "4000", "10000"],
            correct: 2
          }
        ],
        xpReward: 50,
        passingScore: 70
      }
    ];

    await db.insert(quizzes).values(sampleQuizzes);
    console.log("✅ Sample quizzes created");

    // Create achievement badges
    const sampleBadges = [
      {
        name: "Premier Pas",
        description: "Terminer votre premier module",
        icon: "star",
        color: "#fbbf24",
        requirements: { type: "modules_completed", count: 1 },
        xpReward: 25
      },
      {
        name: "Maître des Modules",
        description: "Terminer 5 modules",
        icon: "trophy",
        color: "#3b82f6",
        requirements: { type: "modules_completed", count: 5 },
        xpReward: 100
      },
      {
        name: "Champion des Quiz",
        description: "Réussir 10 quiz",
        icon: "medal",
        color: "#10b981",
        requirements: { type: "quizzes_passed", count: 10 },
        xpReward: 75
      },
      {
        name: "Perfectionniste",
        description: "Obtenir 100% à un quiz",
        icon: "crown",
        color: "#8b5cf6",
        requirements: { type: "perfect_score", count: 1 },
        xpReward: 50
      },
      {
        name: "Montée en Niveau",
        description: "Atteindre le niveau 5",
        icon: "target",
        color: "#f59e0b",
        requirements: { type: "level_reached", level: 5 },
        xpReward: 150
      },
      {
        name: "Collecteur d'XP",
        description: "Accumuler 1000 XP",
        icon: "award",
        color: "#ef4444",
        requirements: { type: "xp_accumulated", amount: 1000 },
        xpReward: 100
      }
    ];

    await db.insert(badges).values(sampleBadges);
    console.log("✅ Achievement badges created");

    console.log("🎉 Database seeding completed successfully!");
    
    console.log("\n📋 Compte administrateur créé :");
    console.log("Email: admin@createuracademy.fr");
    console.log("ID: admin_user_1");
    console.log("\n🔧 Pour vous connecter en tant qu'admin, utilisez l'authentification Replit");
    console.log("Le système détectera automatiquement le rôle admin");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}
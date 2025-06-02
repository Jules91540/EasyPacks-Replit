import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import newLogo from "@assets/Design_sans_titre__22_-removebg-preview.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(onComplete, 500); // Délai pour l'animation de sortie
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        >
          <div className="text-center">
            {/* Logo avec animation - même style que la sidebar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 1,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="mb-8 flex justify-center"
            >
              <div className="w-40 h-40 flex items-center justify-center">
                <img 
                  src={newLogo} 
                  alt="Easy Packs Logo" 
                  className="w-32 h-32 object-contain drop-shadow-2xl rounded-2xl"
                  style={{ filter: 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.5))' }}
                />
              </div>
            </motion.div>

            {/* Nom de l'application avec police Poppins */}
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-5xl text-white mb-4 tracking-wide"
              style={{ 
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600
              }}
            >
              Easy Packs
            </motion.h1>

            {/* Slogan */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-xl text-purple-200 font-medium tracking-wider"
            >
              Créer • Partager • Réussir
            </motion.p>

            {/* Barre de progression */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.2, duration: 1 }}
              className="mt-8 mx-auto h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full overflow-hidden"
              style={{ width: "200px" }}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  delay: 1.2,
                  duration: 1,
                  ease: "easeInOut"
                }}
                className="h-full w-full bg-white/30 rounded-full"
              />
            </motion.div>

            {/* Points de chargement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-6 flex justify-center space-x-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-purple-300 rounded-full"
                />
              ))}
            </motion.div>
          </div>

          {/* Effet de particules en arrière-plan */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 100,
                  opacity: 0
                }}
                animate={{
                  y: -100,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  repeat: Infinity
                }}
                className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
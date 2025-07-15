import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  useEffect(() => {
    // Auto-complete after exactly 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  const backgroundVariants = {
    initial: {
      background: "radial-gradient(circle at 50% 50%, rgba(139, 90, 60, 0.05) 0%, transparent 70%)"
    },
    animate: {
      background: [
        "radial-gradient(circle at 50% 50%, rgba(139, 90, 60, 0.05) 0%, transparent 70%)",
        "radial-gradient(circle at 30% 40%, rgba(212, 196, 176, 0.15) 0%, transparent 60%)",
        "radial-gradient(circle at 70% 60%, rgba(139, 90, 60, 0.2) 0%, transparent 80%)",
        "radial-gradient(circle at 50% 50%, rgba(139, 90, 60, 0.1) 0%, transparent 70%)"
      ],
      transition: {
        duration: 5,
        ease: "easeInOut"
      }
    }
  };

  const titleVariants = {
    initial: { 
      opacity: 0,
      y: 50,
      scale: 0.8
    },
    animate: { 
      opacity: [0, 1, 1, 1, 0],
      y: [50, 0, 0, 0, -30],
      scale: [0.8, 1, 1.05, 1, 1.1],
      transition: {
        duration: 5,
        times: [0, 0.2, 0.6, 0.9, 1],
        ease: "easeInOut"
      }
    }
  };

  const letterVariants = {
    initial: { 
      opacity: 0, 
      y: 30, 
      rotateX: -45,
      scale: 0.5
    },
    animate: { 
      opacity: [0, 1, 1, 1, 0],
      y: [30, 0, 0, 0, -20],
      rotateX: [-45, 0, 0, 0, 15],
      scale: [0.5, 1, 1.02, 1, 1.1],
      transition: {
        duration: 5,
        times: [0, 0.15, 0.7, 0.9, 1],
        ease: "easeOut"
      }
    }
  };

  const gridVariants = {
    initial: { 
      opacity: 0,
      scale: 0,
      rotate: -90
    },
    animate: { 
      opacity: [0, 0, 0.3, 1, 1, 0],
      scale: [0, 0, 0.5, 1, 1.1, 1.2],
      rotate: [-90, -90, -45, 0, 5, 10],
      transition: {
        duration: 5,
        times: [0, 0.4, 0.5, 0.7, 0.9, 1],
        ease: "easeInOut"
      }
    }
  };

  const subtitleVariants = {
    initial: { 
      opacity: 0,
      y: 20
    },
    animate: { 
      opacity: [0, 0, 0, 1, 1, 0],
      y: [20, 20, 10, 0, 0, -10],
      transition: {
        duration: 5,
        times: [0, 0.5, 0.6, 0.7, 0.9, 1],
        ease: "easeOut"
      }
    }
  };

  const floatingElementVariants = {
    animate: {
      x: [0, 100, 50, 120, 0],
      y: [0, 30, -20, 40, 0],
      scale: [1, 1.2, 0.9, 1.3, 1],
      rotate: [0, 45, -30, 60, 0],
      transition: {
        duration: 5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0"
        variants={backgroundVariants}
        initial="initial"
        animate="animate"
      >
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl"
          variants={floatingElementVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-40 h-40 bg-accent/15 rounded-full blur-xl"
          variants={floatingElementVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-secondary/20 rounded-full blur-lg"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 0.8, 1.3, 1],
            opacity: [0.3, 0.7, 0.5, 0.8, 0.3],
          }}
          transition={{
            duration: 5,
            ease: "linear"
          }}
        />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* TIC TAC TOE Title */}
        <motion.div
          variants={titleVariants}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex justify-center items-center gap-4 sm:gap-6 flex-wrap">
            {'TIC TAC TOE'.split(' ').map((word, wordIndex) => (
              <div key={wordIndex} className="flex gap-2 sm:gap-3">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    variants={letterVariants}
                    initial="initial"
                    animate="animate"
                    className="text-6xl sm:text-8xl md:text-9xl font-bold text-primary intro-text-glow"
                    style={{
                      animationDelay: `${(wordIndex * 3 + letterIndex) * 0.1}s`
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tic Tac Toe Grid */}
        <motion.div
          variants={gridVariants}
          initial="initial"
          animate="animate"
          className="mb-6"
        >
          <div className="grid grid-cols-3 gap-2 w-32 h-32 sm:w-40 sm:h-40 mx-auto intro-grid-glow">
            {Array.from({ length: 9 }, (_, i) => (
              <motion.div
                key={i}
                className="bg-primary/20 rounded-lg border-2 border-primary/30 flex items-center justify-center backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0, rotate: 180 }}
                animate={{ 
                  opacity: [0, 0, 0.5, 1, 1, 0],
                  scale: [0, 0, 0.8, 1, 1.1, 1.2],
                  rotate: [180, 180, 90, 0, -10, -20],
                  transition: { 
                    duration: 5,
                    times: [0, 0.5, 0.6, 0.7, 0.9, 1],
                    delay: i * 0.05,
                    ease: "easeOut"
                  }
                }}
              >
                {i % 2 === 0 ? (
                  <motion.span 
                    className="text-2xl sm:text-3xl font-bold text-primary"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ 
                      rotate: [180, 0, -10],
                      opacity: [0, 0, 1, 1, 0],
                      transition: { 
                        duration: 5,
                        times: [0, 0.6, 0.7, 0.9, 1],
                        delay: i * 0.03
                      }
                    }}
                  >
                    X
                  </motion.span>
                ) : (
                  <motion.div 
                    className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-accent rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 0, 1, 1.1, 1.2],
                      opacity: [0, 0, 1, 1, 0],
                      transition: { 
                        duration: 5,
                        times: [0, 0.6, 0.7, 0.9, 1],
                        delay: i * 0.03
                      }
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          variants={subtitleVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          <p className="text-lg sm:text-xl text-muted-foreground font-medium">
            Cozy Gaming Experience
          </p>
        </motion.div>

        {/* Progress Dots */}
        <motion.div
          className="mt-8 flex justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: [0, 0, 1, 1, 0],
            y: [20, 10, 0, 0, -10],
            transition: {
              duration: 5,
              times: [0, 0.3, 0.4, 0.9, 1],
              ease: "easeOut"
            }
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: 4,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import styles from './LevelIndicator.module.css'; // Import CSS Module

const LevelIndicator = () => {
  const { levels, currentLevelIndex } = useGameStore();
  const currentLevel = levels[currentLevelIndex];

  if (!currentLevel) return null;

  // Calculate progress percentage
  const progress = Math.floor((currentLevelIndex / (levels.length - 1)) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.levelIndicator}>
        <div className={styles.header}>
          <h2 className={styles.levelTitle}>Level {currentLevel.id}</h2>
          <span className={styles.levelCounter}>
            {currentLevelIndex + 1} / {levels.length}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <motion.div 
            className={styles.progressBar}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <p className={styles.description}>{currentLevel.description}</p>
      </div>
    </div>
  );
};

export default LevelIndicator;
import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import Cauldron from './components/Cauldron';
import Toolbar from './components/Toolbar';
import FeedbackDisplay from './components/FeedbackDisplay';
import LevelIndicator from './components/LevelIndicator';
import { motion } from 'framer-motion'; // Keep for button animation
import { preloadSounds } from './utils/soundUtils';
import { formatEquationSide } from './utils/equationParser';
import styles from './App.module.css'; // Import the CSS Module for App

function App() {
  // --- State and Store Access ---
  const {
    loadLevel,
    leftCauldron,
    rightCauldron,
    isSolved,
    goToNextLevel,
    currentLevelIndex,
    leftCauldronStatus,
    rightCauldronStatus,
    levels,
  } = useGameStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effects ---
  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    const savedIndex = useGameStore.getState().currentLevelIndex;
    loadLevel(savedIndex || 0);
    setIsInitialized(true);
  }, [loadLevel]);

  // --- Render Logic ---
  if (!isInitialized) {
    // Use loading style from App.module.css
    return <div className={styles.loadingMessage}>Loading Alchemist's Workshop...</div>;
  }

  const leftSideString = formatEquationSide(leftCauldron) || "0";
  const rightSideString = formatEquationSide(rightCauldron) || "0";
  const fullEquationString = `${leftSideString} = ${rightSideString}`;
  const isLastLevel = currentLevelIndex >= levels.length - 1;

  // --- JSX Structure ---
  return (
    // Apply main container style
    <div className={styles.appContainer}>

      {/* Header Title */}
      <h1 className={styles.mainTitle}>
        Alchemist's Workshop
      </h1>

      {/* Static Info Section */}
      <LevelIndicator />
      <FeedbackDisplay />

      {/* Horizontal Equation Display Area */}
      <div className={styles.equationDisplay}>
        <span className={styles.equationText}>
          {fullEquationString}
        </span>
      </div>

      {/* Cauldrons Row */}
      <div className={styles.cauldronsContainer}>
        <Cauldron
          key={`left-${currentLevelIndex}`}
          sideData={leftCauldron}
          sideName="Left"
          status={leftCauldronStatus}
        />
        <Cauldron
          key={`right-${currentLevelIndex}`}
          sideData={rightCauldron}
          sideName="Right"
          status={rightCauldronStatus}
        />
      </div>

      {/* Toolbar Area */}
      <Toolbar />

      {/* Conditional Next Level Button / Completion Message */}
      <div className={styles.controlsContainer}>
        {isSolved && !isLastLevel && (
          <motion.button
            // Framer motion props remain
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            onClick={goToNextLevel}
            // Apply button style from App.module.css
            className={styles.nextLevelButton}
          >
            Next Level →
          </motion.button>
        )}
        {isSolved && isLastLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            // Apply completion message style
            className={styles.completionMessage}
          >
            You have mastered all the recipes!
          </motion.div>
        )}
      </div>

      {/* Footer Area */}
      <footer className={styles.footer}>
        Level {currentLevelIndex + 1} / {levels.length} | Built with Magic & Code
      </footer>
    </div>
  );
}

export default App;

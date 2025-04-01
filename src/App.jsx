import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import Cauldron from './components/Cauldron';
import Toolbar from './components/Toolbar';
import FeedbackDisplay from './components/FeedbackDisplay';
import LevelIndicator from './components/LevelIndicator';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { preloadSounds } from './utils/soundUtils';
import { formatEquationSide } from './utils/equationParser';
import { formatSideVisually } from './utils/visualFormatter';
import styles from './App.module.css';

function App() {
  // --- State and Store Access ---
  const {
    loadLevel, leftCauldron, rightCauldron, isSolved, goToNextLevel,
    currentLevelIndex, leftCauldronStatus, rightCauldronStatus, levels,
    showSymbolsTemporarily, setShowSymbolsTemporarily, targetVariable, // Get targetVariable for instructions
    // --- NEW: Answer State ---
    userAnswer, setUserAnswer, isAnswerCorrect, checkUserAnswer, solutionValue
  } = useGameStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effects ---
  useEffect(() => { preloadSounds(); }, []);
  useEffect(() => {
    const savedIndex = useGameStore.getState().currentLevelIndex;
    loadLevel(savedIndex || 0);
    setIsInitialized(true);
  }, [loadLevel]);

  // --- Render Logic ---
  if (!isInitialized) {
    return <div className={styles.loadingMessage}>Loading Alchemist's Workshop...</div>;
  }

  // Determine Display Mode
  let displayMode = 'icon';
  if (currentLevelIndex >= 10 && currentLevelIndex < 20) displayMode = 'hybrid';
  else if (currentLevelIndex >= 20) displayMode = 'symbol';

  // Prepare Equation Display Content
  let leftDisplayContent, rightDisplayContent;
  const showSymbols = displayMode === 'symbol' || (displayMode === 'hybrid' && showSymbolsTemporarily);
  if (showSymbols) {
    leftDisplayContent = formatEquationSide(leftCauldron) || "0";
    rightDisplayContent = formatEquationSide(rightCauldron) || "0";
  } else {
    leftDisplayContent = formatSideVisually(leftCauldron);
    rightDisplayContent = formatSideVisually(rightCauldron);
  }

  const isLastLevel = currentLevelIndex >= levels.length - 1;
  const showAnswerInput = isSolved && !isAnswerCorrect; // Show input when solved but not yet correct

  // --- Determine Instructions Text ---
  let instructionsText = `Goal: Isolate the ${ingredients[targetVariable]?.symbol || targetVariable}...`;
  if (isSolved && !isAnswerCorrect) {
      instructionsText = `Equation balanced! What is the value of ${ingredients[targetVariable]?.symbol || targetVariable}?`;
  } else if (isAnswerCorrect) {
      instructionsText = `Correct! ${targetVariable} = ${solutionValue}. Ready for the next level!`;
  } else if (displayMode === 'hybrid') {
    instructionsText = "Icons represent ingredients. Hold the (👁️) button below to see the algebraic symbols.";
  } else if (displayMode === 'symbol') {
    instructionsText = `Goal: Isolate ${targetVariable} using algebraic operations.`;
  }

  // Event Handlers for Reveal Button
  const handleRevealStart = () => setShowSymbolsTemporarily(true);
  const handleRevealEnd = () => setShowSymbolsTemporarily(false);
  
  // --- NEW: Answer Input Handlers ---
  const handleAnswerChange = (e) => setUserAnswer(e.target.value);
  const handleAnswerSubmit = (e) => {
      e.preventDefault(); // Prevent form submission reload
      checkUserAnswer();
  };

  // --- JSX Structure ---
  return (
    <div className={styles.appContainer}>
      <h1 className={styles.mainTitle}>Alchemist's Workshop</h1>

      {/* --- Instructions Area --- */}
      <AnimatePresence>
        <motion.div
          key={`instructions-${currentLevelIndex}-${isSolved}-${isAnswerCorrect}`} // Update key to trigger animation on state change
          className={styles.instructionsBox}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }} // Optional exit animation
          transition={{ duration: 0.4 }}
        >
          {instructionsText}
        </motion.div>
      </AnimatePresence>

      <LevelIndicator />
      <FeedbackDisplay />

      {/* Equation Display Area - Adjusted for side alignment */}
      <div className={styles.equationDisplay}>
        <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-end' }}> {/* Left Side */}
          {showSymbols ? (
            <span className={styles.equationText}>{leftDisplayContent}</span>
          ) : (
            <div className={styles.visualEquationSide}>{leftDisplayContent}</div>
          )}
        </div>
        <span className={styles.equalsSignVisual}>=</span> {/* Equals Sign */}
        <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-start' }}> {/* Right Side */}
           {showSymbols ? (
            <span className={styles.equationText}>{rightDisplayContent}</span>
          ) : (
            <div className={styles.visualEquationSide}>{rightDisplayContent}</div>
          )}
        </div>
      </div>

      {/* Reveal Symbols Button (Conditional) */}
      {displayMode === 'hybrid' && !isSolved && ( /* Hide reveal when solved */
        <div className={styles.revealButtonContainer}>
          <motion.button // Add motion here too
            className={styles.revealButton}
            onMouseDown={handleRevealStart} onMouseUp={handleRevealEnd}
            onTouchStart={handleRevealStart} onTouchEnd={handleRevealEnd}
            onMouseLeave={handleRevealEnd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showSymbolsTemporarily ? 'Release Symbols' : 'Reveal Symbols'} (👁️)
          </motion.button>
        </div>
      )}
      
      {/* --- NEW Answer Input Area (Conditional) --- */}
      {showAnswerInput && (
          <motion.form
              className={styles.answerForm}
              onSubmit={handleAnswerSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
          >
              <input
                  type="number"
                  step="any" // Allow decimals
                  value={userAnswer}
                  onChange={handleAnswerChange}
                  className={styles.answerInput}
                  placeholder={`Enter value for ${targetVariable}...`}
                  aria-label={`Enter value for ${targetVariable}`}
                  required
                  autoFocus
              />
              <motion.button
                  type="submit"
                  className={styles.answerButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              >
                  Check Answer
              </motion.button>
          </motion.form>
      )}

      {/* Cauldrons Row */}
      <div className={styles.cauldronsContainer}>
        <Cauldron key={`left-${currentLevelIndex}`} sideData={leftCauldron} sideName="Left" status={leftCauldronStatus} />
        <Cauldron key={`right-${currentLevelIndex}`} sideData={rightCauldron} sideName="Right" status={rightCauldronStatus} />
      </div>

      {/* Toolbar Area - Disable toolbar when solved */}
      <Toolbar />

      {/* Controls Container */}
      <div className={styles.controlsContainer}>
        {/* Show Next Level ONLY when solved AND answer is correct */}
        {isSolved && isAnswerCorrect && !isLastLevel && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }} // Adjusted spring
            whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
            onClick={goToNextLevel} className={styles.nextLevelButton}
          >
            Next Level →
          </motion.button>
        )}
        {/* Show Completion Message */}
        {isSolved && isAnswerCorrect && isLastLevel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className={styles.completionMessage}
          >
            You have mastered all the recipes!
          </motion.div>
        )}
      </div>

      {/* Footer Area */}
      <footer className={styles.footer}>
        Level {currentLevelIndex + 1} / {levels.length} | Display: {displayMode} | Built with Magic & Code
      </footer>
    </div>
  );
}

export default App;

// Helper component from levelData (needed for instructions)
const ingredients = {
  x: { name: "Philosopher's Stone", symbol: '💎', color: 'bg-stone-gold' },
  _constant: { name: "Glow Shroom", symbol: '🍄', color: 'bg-potion-green' },
  y: { name: "Moon Dew", symbol: '💧', color: 'bg-blue-400' },
};

import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import Cauldron from './components/Cauldron';
import Toolbar from './components/Toolbar';
import FeedbackDisplay from './components/FeedbackDisplay';
import LevelIndicator from './components/LevelIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { preloadSounds } from './utils/soundUtils';
import { formatEquationSide } from './utils/equationParser';
import { formatSideVisually } from './utils/visualFormatter';
// --- Import ingredients data ---
import { ingredients } from './levels/levelData';
import styles from './App.module.css';

function App() {
  // --- State and Store Access ---
  const {
    loadLevel, leftCauldron, rightCauldron, isSolved, goToNextLevel,
    currentLevelIndex, leftCauldronStatus, rightCauldronStatus, levels,
    showSymbolsTemporarily, setShowSymbolsTemporarily, targetVariable,
    userAnswer, setUserAnswer, isAnswerCorrect, checkUserAnswer, trueSolutionValue // Use trueSolutionValue
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

  // --- Determine Placeholder/Label for Answer Box ---
  let answerPlaceholder = `Enter value for ${targetVariable}...`;
  let answerLabel = `What is the value of ${targetVariable}?`;
  if (displayMode === 'icon' || displayMode === 'hybrid') {
      const targetSymbol = ingredients[targetVariable]?.symbol || targetVariable;
      const constantSymbol = ingredients['_constant']?.symbol || 'value';
      // Ask in terms of icons
      answerPlaceholder = `How many ${constantSymbol} = 1 ${targetSymbol}?`;
      answerLabel = `How many ${constantSymbol} equal 1 ${targetSymbol}?`;
  }

  // Instructions Text Logic
  let instructionsText = `Goal: Isolate the ${ingredients[targetVariable]?.symbol || targetVariable}...`;
   if (isAnswerCorrect) {
       instructionsText = `Correct! ${targetVariable} = ${trueSolutionValue}. Ready for the next level!`;
   } else if (displayMode === 'hybrid') {
     instructionsText = "Icons represent ingredients. Hold the (👁️) button below to see the algebraic symbols.";
   } else if (displayMode === 'symbol') {
     instructionsText = `Goal: Isolate ${targetVariable} using algebraic operations.`;
   }

  // Event Handlers
  const handleRevealStart = () => setShowSymbolsTemporarily(true);
  const handleRevealEnd = () => setShowSymbolsTemporarily(false);
  const handleAnswerChange = (e) => setUserAnswer(e.target.value);
  const handleAnswerSubmit = (e) => {
      e.preventDefault();
      checkUserAnswer();
  };

  // --- JSX Structure ---
  return (
    <div className={styles.appContainer}>
      <h1 className={styles.mainTitle}>Alchemist's Workshop</h1>

      {/* Instructions Area */}
      <AnimatePresence>
        <motion.div
          key={`instructions-${currentLevelIndex}-${isAnswerCorrect}`}
          className={styles.instructionsBox}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.4 }}
        >
          {instructionsText}
        </motion.div>
      </AnimatePresence>

      <LevelIndicator />
      <FeedbackDisplay />

      {/* Equation Display Area */}
      <div className={styles.equationDisplay}>
        <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-end' }}>
          {showSymbols ? (
            <span className={styles.equationText}>{leftDisplayContent}</span>
          ) : (
            <div className={styles.visualEquationSide}>{leftDisplayContent}</div>
          )}
        </div>
        <span className={styles.equalsSignVisual}>=</span>
        <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-start' }}>
           {showSymbols ? (
            <span className={styles.equationText}>{rightDisplayContent}</span>
          ) : (
            <div className={styles.visualEquationSide}>{rightDisplayContent}</div>
          )}
        </div>
      </div>

      {/* Reveal Symbols Button (Conditional) - Hide if answer is correct */}
      {displayMode === 'hybrid' && !isAnswerCorrect && (
        <div className={styles.revealButtonContainer}>
          <motion.button
            className={styles.revealButton}
            onMouseDown={handleRevealStart} 
            onMouseUp={handleRevealEnd}
            onTouchStart={handleRevealStart} 
            onTouchEnd={handleRevealEnd}
            onMouseLeave={handleRevealEnd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showSymbolsTemporarily ? 'Release Symbols' : 'Reveal Symbols'} (👁️)
          </motion.button>
        </div>
      )}
      
      {/* --- Answer Input Area (Always Visible) --- */}
      <motion.form
          className={styles.answerForm}
          onSubmit={handleAnswerSubmit}
          // Animate presence based on whether the answer is already correct
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isAnswerCorrect ? 0.5 : 1, y: isAnswerCorrect ? 10 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ visibility: isAnswerCorrect ? 'visible' : 'visible' }} // Always visible
      >
          <label htmlFor="answerInput" className={styles.answerLabel}>
              {answerLabel}
          </label>
          <input
              id="answerInput"
              type="number"
              step="any"
              value={userAnswer}
              onChange={handleAnswerChange}
              className={styles.answerInput}
              placeholder={answerPlaceholder} // Use dynamic placeholder
              aria-label={answerLabel} // Use dynamic label
              required
              // Disable input if answer is already correct
              disabled={isAnswerCorrect}
          />
          <motion.button
              type="submit"
              className={styles.answerButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isAnswerCorrect} // Disable button when correct
          >
              Check Answer
          </motion.button>
      </motion.form>

      {/* Cauldrons Row */}
      <div className={styles.cauldronsContainer}>
        <Cauldron key={`left-${currentLevelIndex}`} sideData={leftCauldron} sideName="Left" status={leftCauldronStatus} />
        <Cauldron key={`right-${currentLevelIndex}`} sideData={rightCauldron} sideName="Right" status={rightCauldronStatus} />
      </div>

      {/* Toolbar Area - Disable toolbar if answer is correct */}
      <Toolbar />

      {/* Controls Container */}
      <div className={styles.controlsContainer}>
        {/* Show Next Level ONLY when answer is correct */}
        {isAnswerCorrect && !isLastLevel && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
            onClick={goToNextLevel} 
            className={styles.nextLevelButton}
          >
            Next Level →
          </motion.button>
        )}
        {isAnswerCorrect && isLastLevel && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
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

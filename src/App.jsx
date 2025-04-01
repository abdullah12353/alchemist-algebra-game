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
import { ingredients } from './levels/levelData';
import styles from './App.module.css'; // Import App specific styles

function App() {
  // --- State and Store Access ---
  const {
    loadLevel, leftCauldron, rightCauldron, isSolved, goToNextLevel,
    currentLevelIndex, leftCauldronStatus, rightCauldronStatus, levels,
    showSymbolsTemporarily, setShowSymbolsTemporarily, targetVariable,
    userAnswer, setUserAnswer, isAnswerCorrect, checkUserAnswer, trueSolutionValue
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
  const showAnswerInput = !isAnswerCorrect; // Show input until correct

  // Instructions Text Logic
  let instructionsText = `Goal: Isolate the ${ingredients[targetVariable]?.symbol || targetVariable}...`;
  if (isAnswerCorrect) { 
    instructionsText = `Correct! ${targetVariable} = ${trueSolutionValue}.`; 
  } else if (displayMode === 'hybrid') {
    instructionsText = "Icons represent ingredients. Hold the (👁️) button below to see the algebraic symbols.";
  } else if (displayMode === 'symbol') {
    instructionsText = `Goal: Isolate ${targetVariable} using algebraic operations.`;
  }

  // Answer Box Placeholder/Label Logic
  let answerPlaceholder = `Enter value for ${targetVariable}...`;
  let answerLabel = `What is the value of ${targetVariable}?`;
  if (displayMode === 'icon' || displayMode === 'hybrid') {
    const targetSymbol = ingredients[targetVariable]?.symbol || targetVariable;
    const constantSymbol = ingredients['_constant']?.symbol || 'value';
    // Ask in terms of icons
    answerPlaceholder = `How many ${constantSymbol} = 1 ${targetSymbol}?`;
    answerLabel = `How many ${constantSymbol} equal 1 ${targetSymbol}?`;
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
      {/* Background elements for theme */}
      <div className={styles.bgDecorationLeft}></div>
      <div className={styles.bgDecorationRight}></div>

      {/* Header */}
      <motion.h1
          className={styles.mainTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
      >
          Alchemist's Workshop
      </motion.h1>

      {/* Main Workbench Area */}
      <div className={styles.workbenchArea}>

          {/* Top Info Row (Instructions & Level) */}
          <div className={styles.infoRow}>
              <motion.div
                  key={`instructions-${currentLevelIndex}`}
                  className={styles.instructionsBox}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
              >
                  {instructionsText}
              </motion.div>
              <LevelIndicator />
          </div>

          {/* Feedback Display */}
          <FeedbackDisplay />

          {/* Equation Display (Recipe Scroll) */}
          <motion.div
              key={`equation-${currentLevelIndex}`} // Animate on level change
              className={styles.equationDisplay}
              initial={{ opacity: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
          >
              {/* Equation content (sides + equals) */}
              <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-end' }}>
                  {showSymbols ? 
                    <span className={styles.equationText}>{leftDisplayContent}</span> : 
                    <div className={styles.visualEquationSide}>{leftDisplayContent}</div>
                  }
              </div>
              <span className={styles.equalsSignVisual}>=</span>
              <div className={styles.equationSideContainer} style={{ justifyContent: 'flex-start' }}>
                  {showSymbols ? 
                    <span className={styles.equationText}>{rightDisplayContent}</span> : 
                    <div className={styles.visualEquationSide}>{rightDisplayContent}</div>
                  }
              </div>
          </motion.div>

          {/* Reveal Symbols Button (Conditional) */}
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

          {/* Cauldron Interaction Area */}
          <div className={styles.cauldronsContainer}>
              <Cauldron key={`left-${currentLevelIndex}`} sideData={leftCauldron} sideName="Left" status={leftCauldronStatus} />
              <Cauldron key={`right-${currentLevelIndex}`} sideData={rightCauldron} sideName="Right" status={rightCauldronStatus} />
          </div>

          {/* Answer Input Area (Always present until correct) */}
          <AnimatePresence>
              {showAnswerInput && (
                  <motion.form
                      className={styles.answerForm} 
                      onSubmit={handleAnswerSubmit}
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }} 
                      transition={{ duration: 0.3 }}
                  >
                      <label htmlFor="answerInput" className={styles.answerLabel}>{answerLabel}</label>
                      <input 
                        id="answerInput" 
                        type="number" 
                        step="any" 
                        value={userAnswer}
                        onChange={handleAnswerChange} 
                        className={styles.answerInput}
                        placeholder={answerPlaceholder} 
                        aria-label={answerLabel} 
                        required 
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
          </AnimatePresence>

          {/* Next Level Button Area */}
          <div className={styles.controlsContainer}>
              {isAnswerCorrect && !isLastLevel && (
                  <motion.button 
                    onClick={goToNextLevel}
                    className={styles.nextLevelButton}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  > 
                    Next Level → 
                  </motion.button>
              )}
              {isAnswerCorrect && isLastLevel && (
                  <motion.div 
                    className={styles.completionMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  > 
                    You have mastered all the recipes! 
                  </motion.div>
              )}
          </div>

      </div> {/* End Workbench Area */}


      {/* Toolbar (Stays at bottom) */}
      <Toolbar />

      {/* Footer */}
      <footer className={styles.footer}>
          Level {currentLevelIndex + 1} / {levels.length} | Display: {displayMode}
      </footer>
    </div>
  );
}

export default App;

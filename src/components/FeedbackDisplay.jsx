import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import styles from './FeedbackDisplay.module.css'; // Import CSS Module

const FeedbackDisplay = () => {
  // Get status to apply error styling
  const { feedbackMessage, isSolved, leftCauldronStatus } = useGameStore();

  // Determine class based on state
  const messageClass = isSolved
    ? styles.feedbackMessageSolved
    : leftCauldronStatus === 'error' // Check status for error styling
    ? styles.feedbackMessageError
    : ''; // Default has no extra class

  return (
    <div className={styles.feedbackContainer}>
      <AnimatePresence mode="wait">
        {feedbackMessage && (
          <motion.p
            key={feedbackMessage} // Re-render on message change
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            // Combine base class with conditional class
            className={`${styles.feedbackMessage} ${messageClass}`}
          >
            {feedbackMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackDisplay;
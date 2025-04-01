import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ingredient from './Ingredient';
import styles from './Cauldron.module.css'; // Import CSS Module

const Cauldron = ({ sideData, sideName, status }) => {
  // Filter and sort terms (logic remains the same)
  const terms = Object.entries(sideData)
    .filter(([key, coeff]) => Math.abs(coeff) > 1e-9)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  // Determine dynamic classes based on status
  let statusClass = '';
  if (status === 'success') {
    statusClass = styles.statusSuccess;
  } else if (status === 'error') {
    statusClass = styles.statusError;
  }

  return (
    // Apply base wrapper class and conditional status class
    <div className={`${styles.cauldronWrapper} ${statusClass}`}>
      {/* Subtle Bubbles Effect */}
      <div className={styles.bubbleContainer}>
          <div className={`${styles.bubble} ${styles.bubbleSm}`} style={{ left: '20%', animationDelay: '0s' }}></div>
          <div className={`${styles.bubble} ${styles.bubbleLg}`} style={{ left: '50%', animationDelay: '1s' }}></div>
          <div className={`${styles.bubble} ${styles.bubbleMd}`} style={{ left: '75%', animationDelay: '0.5s' }}></div>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
          <h3 className={styles.sideTitle}>{sideName} Side</h3>
          <div className={styles.ingredientsContainer}>
            <AnimatePresence>
              {terms.length === 0 && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className={styles.emptyMessage} // Style for empty message
                 >
                    Empty
                 </motion.div>
              )}
              {terms.map(([key, coeff]) => (
                // Key needs to be unique and stable
                <Ingredient key={`${sideName}-${key}-${coeff}`} termKey={key} coefficient={coeff} />
              ))}
            </AnimatePresence>
          </div>
      </div>
    </div>
  );
};

export default Cauldron;
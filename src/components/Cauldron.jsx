import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ingredient from './Ingredient';
import styles from './Cauldron.module.css';

// --- NEW: Configurable limits ---
const MAX_ICONS_NO_SCALE = 12; // Max icons before scaling starts
const MAX_ICONS_BEFORE_CLIPPING = 25; // Absolute max (approx) before it gets too small/clips

const Cauldron = ({ sideData, sideName, status }) => {
  // Calculate total icons and terms *before* rendering
  let totalIcons = 0;
  const termsToRender = Object.entries(sideData)
    .filter(([key, coeff]) => Math.abs(coeff) > 1e-9)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)); // Sort for consistent order

  termsToRender.forEach(([key, coeff]) => {
    totalIcons += Math.min(Math.abs(coeff), MAX_ICONS_BEFORE_CLIPPING); // Count icons up to the limit
  });

  // Determine scale factor based on total icons
  let scale = 1.0;
  let containerClass = styles.ingredientsContainer; // Base class
  if (totalIcons > MAX_ICONS_NO_SCALE && totalIcons <= 18) {
      scale = 0.85;
      containerClass += ` ${styles.scale85}`; // Add scaling class
  } else if (totalIcons > 18) { // Add another tier if needed
      scale = 0.7;
      containerClass += ` ${styles.scale70}`;
  }
   // Add more tiers (e.g., scale 0.6) if necessary

  // Status class logic remains the same
  let statusClass = '';
  if (status === 'success') statusClass = styles.statusSuccess;
  else if (status === 'error') statusClass = styles.statusError;

  return (
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
          {/* Apply dynamic scaling class */}
          <div className={containerClass}>
            <AnimatePresence>
              {termsToRender.length === 0 && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className={styles.emptyMessage}
                 >
                    Empty
                 </motion.div>
              )}
              {/* --- MODIFIED: Render individual icons --- */}
              {termsToRender.map(([key, coeff]) => {
                  const count = Math.min(Math.abs(coeff), MAX_ICONS_BEFORE_CLIPPING); // Limit rendered icons
                  const items = [];
                  for (let i = 0; i < count; i++) {
                      // Pass scale factor to Ingredient, key needs to be unique
                      items.push(
                          <Ingredient
                              key={`${sideName}-${key}-${i}`}
                              termKey={key}
                              coefficient={1} // Visually represent as 1
                              scale={scale} // Pass scale prop
                          />
                      );
                  }
                  // Wrap term's icons if needed for styling (optional)
                  return (
                      <React.Fragment key={`${sideName}-${key}-term`}>
                          {items}
                      </React.Fragment>
                  );
              })}
            </AnimatePresence>
          </div>
      </div>
    </div>
  );
};

export default Cauldron;
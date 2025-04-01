import React from 'react';
import { motion } from 'framer-motion';
import { ingredients } from '../levels/levelData';
import styles from './Ingredient.module.css';

// --- Accept scale prop ---
const Ingredient = ({ termKey, coefficient, scale = 1.0 }) => {
  const visual = ingredients[termKey] || ingredients['_constant'];

  if (Math.abs(coefficient) < 1e-9) return null;

  const variants = {
    initial: { opacity: 0, y: 10, scale: 0.8 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      transition: { duration: 0.2 } 
    }
  };

  let backgroundClass = '';
  switch (termKey) {
    case 'x':
    case 'y':
    case 'z':
      backgroundClass = styles.bgStoneGold;
      break;
    case '_constant':
      backgroundClass = styles.bgGlowShroom;
      break;
    default:
      backgroundClass = styles.bgMoonDew;
  }

  return (
    <motion.div
      variants={variants} initial="initial" animate="animate" exit="exit"
      layout whileHover={{ scale: 1.1 * scale, y: -2 }} // Adjust hover based on base scale
      whileTap={{ scale: 0.95 * scale }}
      className={`${styles.ingredientWrapper} ${backgroundClass}`}
      title={`${visual.name}`}
    >
      <div className={styles.ingredientContent}>
         <span className={styles.symbol}>{visual.symbol}</span>
      </div>
    </motion.div>
  );
};

export default Ingredient;
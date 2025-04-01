import React from 'react';
import { motion } from 'framer-motion';
import { ingredients } from '../levels/levelData';
import styles from './Ingredient.module.css'; // Import CSS Module

const Ingredient = ({ termKey, coefficient }) => {
  // Get visual data (symbol, name, base color key)
  const visual = ingredients[termKey] || ingredients['_constant'];
  const isNegative = coefficient < 0;

  if (Math.abs(coefficient) < 1e-9) {
    return null;
  }

  // Animation variants (remain the same)
  const variants = {
    initial: { scale: 0.3, opacity: 0, y: 10 },
    animate: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 15 }
    },
    exit: {
        scale: 0.5,
        opacity: 0,
        x: Math.random() < 0.5 ? -20 : 20,
        transition: { duration: 0.2 }
    },
  };

  // Format coefficient display logic (remain the same)
  const formatCoeff = (num) => {
      const absNum = Math.abs(num);
      if (termKey !== '_constant' && absNum === 1) return '';
      return parseFloat(absNum.toFixed(2)).toString();
  }
  const coeffStr = formatCoeff(coefficient);

  // Determine background class based on visual data
  let backgroundClass = '';
  switch (termKey) {
      case 'x': backgroundClass = styles.bgStoneGold; break;
      case '_constant': backgroundClass = styles.bgGlowShroom; break;
      case 'y': backgroundClass = styles.bgMoonDew; break;
      default: backgroundClass = styles.bgGlowShroom; // Fallback
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      // Combine base wrapper class with dynamic background class
      className={`${styles.ingredientWrapper} ${backgroundClass}`}
      title={`${coefficient.toFixed(2)} ${visual.name}`}
    >
      <div className={styles.ingredientContent}>
         {isNegative && <span className={styles.sign}>-</span>}
         {coeffStr && <span className={styles.coefficient}>{coeffStr}</span>}
         <span className={styles.symbol}>{visual.symbol}</span>
      </div>
    </motion.div>
  );
};

export default Ingredient;
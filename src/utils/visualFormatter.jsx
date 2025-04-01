// src/utils/visualFormatter.jsx
import React from 'react';
import Ingredient from '../components/Ingredient';
import styles from './visualFormatter.module.css';

const OperatorVisual = ({ type = 'plus' }) => (
  <span className={`${styles.operatorVisual} ${type === 'minus' ? styles.minus : styles.plus}`}>
    {type === 'minus' ? '−' : '+'}
  </span>
);

// --- MODIFIED TermVisual for Main Display ---
// Always shows number (if > 1 or negative) and ONE icon
const TermVisual = ({ termKey, coefficient }) => {
  if (Math.abs(coefficient) < 1e-9) return null;

  const absCoefficient = Math.abs(coefficient);
  const items = [];
  const showNumber = absCoefficient !== 1; // Show number unless it's exactly 1

  // Add visual negative sign if needed
  if (coefficient < 0) {
      items.push(<span key={`${termKey}-neg`} className={styles.negativeSignVisual}>−</span>);
  }

  // Add the number if needed
  if (showNumber) {
    const displayNum = parseFloat(absCoefficient.toFixed(2)).toString();
    items.push(
      <span key={`${termKey}-num`} className={styles.termCoefficientNumber}>
        {displayNum}
      </span>
    );
  }

  // Add ONE icon
  items.push(<Ingredient key={`${termKey}-icon`} termKey={termKey} coefficient={1} />);

  return (
    <div className={styles.termVisual}>
      {items}
    </div>
  );
};


export const formatSideVisually = (sideData) => {
  const elements = [];
  const sortedKeys = Object.keys(sideData)
      .filter(key => Math.abs(sideData[key]) > 1e-9)
      .sort((a, b) => {
          if (a === '_constant') return 1;
          if (b === '_constant') return -1;
          return a.localeCompare(b);
      });

  if (sortedKeys.length === 0) {
    return [<span key="empty" className={styles.emptyVisual}>0</span>]; // Show 0 visually
  }

  sortedKeys.forEach((key, index) => {
    const coefficient = sideData[key];
    const isNegative = coefficient < 0;

    // Add operator visual (+) ONLY between terms, and only if the *next* term is positive
    if (index > 0 && !isNegative) {
        elements.push(<OperatorVisual key={`op-${index}`} type={'plus'} />);
    }
    // Negative sign is now handled *within* TermVisual

    elements.push(<TermVisual key={key} termKey={key} coefficient={coefficient} />);
  });

  return elements;
};
import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Import motion
import { useGameStore } from '../store/useGameStore';
import { parseTerm } from '../utils/equationParser';
import styles from './Toolbar.module.css'; // Import CSS Module

// --- Wrap Button in motion.button ---
const OperationButton = ({ onClick, label, children, className = '', disabled = false, icon = null }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.button} ${className}`}
    aria-label={label}
    // --- Add Hover/Tap Animations ---
    whileHover={{ scale: 1.05, y: -1, transition: { duration: 0.1 } }}
    whileTap={{ scale: 0.95, transition: { duration: 0.05 } }}
  >
    {icon && <span className={styles.buttonIcon}>{icon}</span>}
    <span>{children}</span>
  </motion.button>
);

const Toolbar = () => {
  const { applyOperationToBothSides, undo, resetLevel, history, isAnimating, isSolved } = useGameStore();
  const [value, setValue] = useState('1');
  const [varTerm, setVarTerm] = useState('x');

  const handleApply = (operation) => {
     let operationValue;
     if (operation === 'add' || operation === 'subtract' || operation === 'multiply' || operation === 'divide') {
       operationValue = parseFloat(value);
       if (isNaN(operationValue)) { alert("Please enter a valid number."); return; }
       if ((operation === 'multiply' || operation === 'divide') && operationValue === 0) { alert(`Cannot ${operation} by zero.`); return; }
     } else if (operation === 'addVar' || operation === 'subtractVar') {
         const parsed = parseTerm(varTerm.trim().replace(/\s/g, ''));
         if (!parsed.variable || parsed.variable === '_constant' || isNaN(parsed.coefficient) || parsed.coefficient === 0) { alert("Please enter a valid variable term with a non-zero coefficient (e.g., '2x', '-y', 'x')."); return; }
         operationValue = parsed;
     } else { alert(`Unknown operation type: ${operation}`); return; }
     applyOperationToBothSides(operation, operationValue);
  };

  const canUndo = history.length > 1;
  const isDisabled = isAnimating || isSolved; // General disabled state

  return (
    <div className={styles.toolbarWrapper}>
      {/* Constant Operations */}
      <div className={styles.operationGroup}>
        <input
          type="number" step="any" value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.inputField} aria-label="Value for constant operation"
          disabled={isDisabled}
        />
        <div className={styles.buttonGroup}>
            <OperationButton onClick={() => handleApply('add')} label={`Add ${value}`} className={styles.buttonAdd} disabled={isDisabled} icon="➕">Add</OperationButton>
            <OperationButton onClick={() => handleApply('subtract')} label={`Subtract ${value}`} className={styles.buttonSubtract} disabled={isDisabled} icon="➖">Sub</OperationButton>
            <OperationButton onClick={() => handleApply('multiply')} label={`Multiply by ${value}`} className={styles.buttonMultiply} disabled={isDisabled} icon="✖️">Mult</OperationButton>
            <OperationButton onClick={() => handleApply('divide')} label={`Divide by ${value}`} className={styles.buttonDivide} disabled={isDisabled} icon="➗">Div</OperationButton>
        </div>
      </div>

       {/* Variable Operations */}
       <div className={styles.operationGroup}>
         <input
           type="text" value={varTerm}
           onChange={(e) => setVarTerm(e.target.value)}
           placeholder="e.g., 2x" className={styles.inputField}
           aria-label="Variable term for operation" disabled={isDisabled}
         />
         <div className={styles.buttonGroup}>
            <OperationButton onClick={() => handleApply('addVar')} label={`Add ${varTerm}`} className={styles.buttonAdd} disabled={isDisabled} icon="➕">Add Var</OperationButton>
            <OperationButton onClick={() => handleApply('subtractVar')} label={`Subtract ${varTerm}`} className={styles.buttonSubtract} disabled={isDisabled} icon="➖">Sub Var</OperationButton>
         </div>
       </div>

      {/* Control Buttons */}
      <div className={styles.operationGroup}> {/* Reuse group style for consistency */}
         <div className={styles.buttonGroup}>
            <OperationButton onClick={undo} label="Undo last step" className={styles.buttonUndo} disabled={!canUndo || isAnimating || isSolved} icon="↩️">Undo</OperationButton>
            <OperationButton onClick={resetLevel} label="Reset current level" className={styles.buttonReset} disabled={isAnimating} icon="🔄">Reset</OperationButton>
         </div>
      </div>
    </div>
  );
};

export default Toolbar;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Import persist middleware
import { levels } from '../levels/levelData';
import { parseEquation, formatEquationSide } from '../utils/equationParser';
import { playSound } from '../utils/soundUtils'; // Import sound utility

// Helper to perform deep copy for state history
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// Helper to compare cauldron states (ignoring zero coefficients)
const areSidesEqual = (sideA, sideB) => {
    const cleanA = {};
    const cleanB = {};
    Object.keys(sideA).forEach(k => { if (Math.abs(sideA[k]) > 1e-9) cleanA[k] = sideA[k]; });
    Object.keys(sideB).forEach(k => { if (Math.abs(sideB[k]) > 1e-9) cleanB[k] = sideB[k]; });

    const keysA = Object.keys(cleanA).sort();
    const keysB = Object.keys(cleanB).sort();

    if (keysA.length !== keysB.length) return false;
    if (keysA.length === 0) return true; // Both sides are effectively zero

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (key !== keysB[i] || Math.abs((cleanA[key] || 0) - (cleanB[key] || 0)) > 1e-9) {
            return false;
        }
    }
    return true;
};

// Define initial state outside create for persistence loading
const initialState = {
  levels: levels,
  currentLevelIndex: 0,
  leftCauldron: {},
  rightCauldron: {},
  targetVariable: 'x',
  history: [],
  feedbackMessage: '',
  isSolved: false,
  isAnimating: false,
  // New state for visual feedback
  leftCauldronStatus: 'idle', // 'idle', 'success', 'error'
  rightCauldronStatus: 'idle',
};

export const useGameStore = create(
  // Add persist middleware
  persist(
    (set, get) => ({
      ...initialState, // Spread initial state

      // --- Initialization ---
      loadLevel: (levelIndex) => {
        if (levelIndex >= get().levels.length || levelIndex < 0) {
          console.warn("Attempted to load invalid level index:", levelIndex);
          // Handle completion or error state appropriately
          if (levelIndex >= get().levels.length) {
             set({ feedbackMessage: "Congratulations! All levels completed!", isSolved: true }); // Mark as solved to show button potentially
          }
          return;
        }
        const level = get().levels[levelIndex];
        const { left, right } = parseEquation(level.initialEquation);
        const initialHistory = [{ leftCauldron: deepCopy(left), rightCauldron: deepCopy(right) }];
        set({
          currentLevelIndex: levelIndex,
          leftCauldron: left,
          rightCauldron: right,
          targetVariable: level.targetVariable,
          history: initialHistory,
          feedbackMessage: level.description || `Level ${level.id}: Isolate the ${get().targetVariable}`, // Default message
          isSolved: false,
          isAnimating: false,
          leftCauldronStatus: 'idle',
          rightCauldronStatus: 'idle',
        });
        playSound('levelStart'); // Play sound on level load
      },

      // --- Core Game Actions ---
      _updateState: (newLeft, newRight, message = '', status = 'success') => {
        const currentState = get();
        const newHistory = [...currentState.history, { leftCauldron: deepCopy(newLeft), rightCauldron: deepCopy(newRight) }];

        set({
            leftCauldron: newLeft,
            rightCauldron: newRight,
            history: newHistory,
            feedbackMessage: message,
            isAnimating: true, // Start animation/block input
            leftCauldronStatus: status, // Set status for visual feedback
            rightCauldronStatus: status,
        });

        // Play sound based on status
        if (status === 'success') {
            playSound('operationSuccess');
        } else if (status === 'error') {
            playSound('operationFail');
        }

        // Check for solution after state update and animation delay
        setTimeout(() => {
            const solved = get().checkSolved();
            set({
                isSolved: solved,
                isAnimating: false, // End animation/allow input
                // Reset status after a short delay, unless solved
                leftCauldronStatus: solved ? 'success' : 'idle',
                rightCauldronStatus: solved ? 'success' : 'idle',
            });
             if (solved) {
                 const finalLeftStr = formatEquationSide(get().leftCauldron);
                 const finalRightStr = formatEquationSide(get().rightCauldron);
                 set({ feedbackMessage: `Solved! ${finalLeftStr} = ${finalRightStr}` });
                 playSound('levelSolved');
             }
        }, 600); // Slightly longer delay to see status effect
      },

      applyOperationToBothSides: (operation, value) => {
        if (get().isAnimating || get().isSolved) return;

        const { leftCauldron, rightCauldron } = get();
        let newLeft = deepCopy(leftCauldron);
        let newRight = deepCopy(rightCauldron);
        let message = '';
        let status = 'success'; // Assume success initially

        try {
            switch (operation) {
                case 'add':
                    newLeft['_constant'] = (newLeft['_constant'] || 0) + value;
                    newRight['_constant'] = (newRight['_constant'] || 0) + value;
                    message = `Added ${value} to both sides.`;
                    break;
                case 'subtract':
                    newLeft['_constant'] = (newLeft['_constant'] || 0) - value;
                    newRight['_constant'] = (newRight['_constant'] || 0) - value;
                     message = `Subtracted ${value} from both sides.`;
                    break;
                case 'addVar':
                     if (!value.variable || value.coefficient === undefined) throw new Error("Invalid variable term for addition");
                     newLeft[value.variable] = (newLeft[value.variable] || 0) + value.coefficient;
                     newRight[value.variable] = (newRight[value.variable] || 0) + value.coefficient;
                     message = `Added ${value.coefficient > 0 ? value.coefficient : ''}${value.variable} to both sides.`; // Improved message
                     break;
                case 'subtractVar':
                     if (!value.variable || value.coefficient === undefined) throw new Error("Invalid variable term for subtraction");
                     newLeft[value.variable] = (newLeft[value.variable] || 0) - value.coefficient;
                     newRight[value.variable] = (newRight[value.variable] || 0) - value.coefficient;
                     message = `Subtracted ${value.coefficient > 0 ? value.coefficient : ''}${value.variable} from both sides.`; // Improved message
                     break;
                case 'multiply':
                    if (value === 0) throw new Error("Cannot multiply by zero.");
                    Object.keys(newLeft).forEach(key => newLeft[key] *= value);
                    Object.keys(newRight).forEach(key => newRight[key] *= value);
                    message = `Multiplied both sides by ${value}.`;
                    break;
                case 'divide':
                    if (value === 0) throw new Error("Cannot divide by zero.");
                    // Basic check for division leading to issues (optional)
                    // This is tricky - what constitutes an "invalid" division depends on game rules
                    // For now, allow floats. Could add checks later if needed.
                    // const checkDivisibility = (side) => {
                    //    for (const key in side) {
                    //        if ((side[key] / value) % 1 !== 0) return false; // Check for non-integers
                    //    }
                    //    return true;
                    // }
                    // if (!checkDivisibility(newLeft) || !checkDivisibility(newRight)) {
                    //    throw new Error("Division results in non-whole ingredients!");
                    // }
                    Object.keys(newLeft).forEach(key => newLeft[key] /= value);
                    Object.keys(newRight).forEach(key => newRight[key] /= value);
                     message = `Divided both sides by ${value}.`;
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Clean up zero coefficients
            Object.keys(newLeft).forEach(key => { if (Math.abs(newLeft[key]) < 1e-9) delete newLeft[key]; });
            Object.keys(newRight).forEach(key => { if (Math.abs(newRight[key]) < 1e-9) delete newRight[key]; });
             if (Object.keys(newLeft).length === 0) newLeft['_constant'] = 0;
             if (Object.keys(newRight).length === 0) newRight['_constant'] = 0;

            get()._updateState(newLeft, newRight, message, status);

        } catch (error) {
            console.error("Operation Error:", error);
            // Use _updateState to show error feedback visually
            get()._updateState(
                deepCopy(leftCauldron), // Revert to original state on error
                deepCopy(rightCauldron),
                `Error: ${error.message}`,
                'error' // Set status to error
            );
        }
      },

      // --- Solution Checking ---
      checkSolved: () => {
        const { leftCauldron, rightCauldron, targetVariable } = get();

        const cleanLeft = {};
        const cleanRight = {};
        Object.keys(leftCauldron).forEach(k => { if (Math.abs(leftCauldron[k]) > 1e-9) cleanLeft[k] = leftCauldron[k]; });
        Object.keys(rightCauldron).forEach(k => { if (Math.abs(rightCauldron[k]) > 1e-9) cleanRight[k] = rightCauldron[k]; });

        const leftKeys = Object.keys(cleanLeft);
        const rightKeys = Object.keys(cleanRight);

        // Condition 1: x = number
        const isLeftSolved =
          leftKeys.length === 1 &&
          leftKeys[0] === targetVariable &&
          Math.abs(cleanLeft[targetVariable] - 1) < 1e-9 && // Coefficient is 1
          rightKeys.length === 1 && rightKeys[0] === '_constant'; // Right side is just a constant

         // Condition 2: number = x
         const isRightSolved =
           rightKeys.length === 1 &&
           rightKeys[0] === targetVariable &&
           Math.abs(cleanRight[targetVariable] - 1) < 1e-9 && // Coefficient is 1
           leftKeys.length === 1 && leftKeys[0] === '_constant'; // Left side is just a constant

        return isLeftSolved || isRightSolved;
      },

      // --- Navigation ---
      goToNextLevel: () => {
        if (get().isSolved) {
          const nextLevelIndex = get().currentLevelIndex + 1;
          // No need to check length here, loadLevel handles it
          get().loadLevel(nextLevelIndex);
        } else {
            set({ feedbackMessage: "Solve the current level first!" });
            playSound('operationFail'); // Play fail sound if trying to advance unsolved
        }
      },

      resetLevel: () => {
        if (get().isAnimating) return;
        playSound('reset');
        get().loadLevel(get().currentLevelIndex);
      },

      undo: () => {
          if (get().isAnimating) return;
          const history = get().history;
          if (history.length > 1) {
              playSound('undo');
              const newHistory = history.slice(0, -1);
              const previousState = newHistory[newHistory.length - 1];
              set({
                  leftCauldron: deepCopy(previousState.leftCauldron),
                  rightCauldron: deepCopy(previousState.rightCauldron),
                  history: newHistory,
                  isSolved: false,
                  feedbackMessage: "Undo successful.",
                  leftCauldronStatus: 'idle', // Reset status on undo
                  rightCauldronStatus: 'idle',
              });
              // Optional: Re-check solved state instantly after undo if needed
              // const solved = get().checkSolved();
              // set({ isSolved: solved });
          } else {
              set({ feedbackMessage: "Cannot undo further." });
              playSound('operationFail');
          }
      },

    }),
    {
      name: 'alchemist-workshop-progress', // Name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ currentLevelIndex: state.currentLevelIndex }), // Only save the level index
       // On load, merge the saved index with the initial state
       // Note: Zustand v4 might handle merging differently, check docs if needed
       // This basic merge assumes you want to load the saved level index
       // but reset other parts of the state (like cauldron contents)
       merge: (persistedState, currentState) => {
         // Make sure persistedState is valid
         if (persistedState && typeof persistedState.currentLevelIndex === 'number') {
            // Load the level based on the persisted index, but keep other current state defaults
            // We call loadLevel later in App.jsx useEffect based on the loaded index
            return {
                ...currentState, // Keep defaults from initialState
                currentLevelIndex: persistedState.currentLevelIndex, // Overwrite with saved index
            };
         }
         return currentState; // Fallback to current state if persisted is invalid
       },
    }
  )
);
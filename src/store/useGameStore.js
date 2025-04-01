import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// --- Import findSolution ---
import { levels, findSolution } from '../levels/levelData';
import { parseEquation, formatEquationSide } from '../utils/equationParser';
import { playSound } from '../utils/soundUtils';

// Helper to perform deep copy for state history
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));
const FLOAT_TOLERANCE = 1e-6; // Slightly larger tolerance for user input

// Helper to compare cauldron states (ignoring zero coefficients)
const areSidesEqual = (sideA, sideB) => {
    const cleanA = {};
    const cleanB = {};
    Object.keys(sideA).forEach(k => { if (Math.abs(sideA[k]) > FLOAT_TOLERANCE) cleanA[k] = sideA[k]; });
    Object.keys(sideB).forEach(k => { if (Math.abs(sideB[k]) > FLOAT_TOLERANCE) cleanB[k] = sideB[k]; });

    const keysA = Object.keys(cleanA).sort();
    const keysB = Object.keys(cleanB).sort();

    if (keysA.length !== keysB.length) return false;
    if (keysA.length === 0) return true; // Both sides are effectively zero

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (key !== keysB[i] || Math.abs((cleanA[key] || 0) - (cleanB[key] || 0)) > FLOAT_TOLERANCE) {
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
  isSolved: false, // Still useful to know if *current* state is x=N or N=x
  isAnimating: false,
  leftCauldronStatus: 'idle',
  rightCauldronStatus: 'idle',
  showSymbolsTemporarily: false,
  userAnswer: '',
  isAnswerCorrect: false, // Now means: userAnswer matches trueSolutionValue
  // --- Store the TRUE solution for the initial equation ---
  trueSolutionValue: null, // Stores the actual numerical solution for the *level*
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setShowSymbolsTemporarily: (show) => set({ showSymbolsTemporarily: show }),
      setUserAnswer: (answer) => set({ userAnswer: answer }),

      // --- MODIFIED loadLevel ---
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
        
        // --- Calculate true solution on load ---
        const trueSolution = findSolution(level.initialEquation, level.targetVariable);

        set({
          ...initialState, // Reset most state to initial values
          currentLevelIndex: levelIndex,
          levels: get().levels,
          leftCauldron: left,
          rightCauldron: right,
          targetVariable: level.targetVariable,
          history: initialHistory,
          feedbackMessage: level.description || `Level ${level.id}: Balance the cauldrons!`,
          trueSolutionValue: trueSolution, // Store the calculated true solution
          // Ensure flags are reset
          isSolved: false,
          isAnswerCorrect: false,
          userAnswer: '',
          showSymbolsTemporarily: false,
        });
        playSound('levelStart');
      },

      // --- MODIFIED _updateState ---
      _updateState: (newLeft, newRight, message = '', status = 'success') => {
        const currentState = get();
        const newHistory = [...currentState.history, { leftCauldron: deepCopy(newLeft), rightCauldron: deepCopy(newRight) }];
        set({
            leftCauldron: newLeft, 
            rightCauldron: newRight, 
            history: newHistory,
            feedbackMessage: message, 
            isAnimating: true,
            leftCauldronStatus: status, 
            rightCauldronStatus: status,
            // Don't reset answer state here, allow user to check answer anytime
            // isAnswerCorrect: false, userAnswer: '',
        });
        
        if (status === 'success') playSound('operationSuccess');
        else if (status === 'error') playSound('operationFail');

        setTimeout(() => {
            // Check if current state *looks* solved (x=N or N=x)
            const solved = get().checkSolvedState();
            set({
                isSolved: solved, // Set if equation *looks* balanced
                isAnimating: false,
                leftCauldronStatus: solved ? 'success' : 'idle',
                rightCauldronStatus: solved ? 'success' : 'idle',
            });
             // Don't change feedback here based on isSolved anymore
             // Feedback comes from checkUserAnswer or operations
        }, 600);
      },

      // --- RENAMED checkSolved to checkSolvedState ---
      // Checks if the *current* cauldron state is in the form x=N or N=x
      // Does NOT compare to the true solution.
      checkSolvedState: () => {
        const { leftCauldron, rightCauldron, targetVariable } = get();
        const cleanLeft = {}; 
        const cleanRight = {};
        
        Object.keys(leftCauldron).forEach(k => { 
          if (Math.abs(leftCauldron[k]) > FLOAT_TOLERANCE) cleanLeft[k] = leftCauldron[k]; 
        });
        
        Object.keys(rightCauldron).forEach(k => { 
          if (Math.abs(rightCauldron[k]) > FLOAT_TOLERANCE) cleanRight[k] = rightCauldron[k]; 
        });
        
        const leftKeys = Object.keys(cleanLeft); 
        const rightKeys = Object.keys(cleanRight);
        
        // Condition 1: x = number
        const isLeftSolved = leftKeys.length === 1 && 
                             leftKeys[0] === targetVariable && 
                             Math.abs(cleanLeft[targetVariable] - 1) < FLOAT_TOLERANCE && 
                             rightKeys.length === 1 && 
                             rightKeys[0] === '_constant';
        
        // Condition 2: number = x
        const isRightSolved = rightKeys.length === 1 && 
                              rightKeys[0] === targetVariable && 
                              Math.abs(cleanRight[targetVariable] - 1) < FLOAT_TOLERANCE && 
                              leftKeys.length === 1 && 
                              leftKeys[0] === '_constant';
        
        return isLeftSolved || isRightSolved;
      },

      // --- MODIFIED checkUserAnswer ---
      checkUserAnswer: () => {
          const { userAnswer, trueSolutionValue, targetVariable } = get();

          // Handle special cases from findSolution
          if (trueSolutionValue === null) {
              set({ feedbackMessage: "Hmm, this equation seems unsolvable!", isAnswerCorrect: false });
              playSound('operationFail');
              return;
          }
          if (trueSolutionValue === Infinity) {
               set({ feedbackMessage: "Any number works here! (Infinite Solutions)", isAnswerCorrect: true }); // Mark as correct for progression
               playSound('operationSuccess');
               return;
          }

          const userAnswerNum = parseFloat(userAnswer);
          if (isNaN(userAnswerNum)) {
              set({ feedbackMessage: "Please enter a valid number.", isAnswerCorrect: false });
              playSound('operationFail');
              return;
          }

          // Compare user input to the stored *true* solution for the level
          if (Math.abs(userAnswerNum - trueSolutionValue) < FLOAT_TOLERANCE) {
              set({
                  feedbackMessage: `Correct! The solution is ${targetVariable} = ${trueSolutionValue}. Well done!`,
                  isAnswerCorrect: true, // Set flag for progression
                  // Optionally, force the cauldrons to the solved state if desired
                  // leftCauldron: { [targetVariable]: 1 },
                  // rightCauldron: { _constant: trueSolutionValue },
                  // isSolved: true, // Mark as visually solved too
              });
              playSound('operationSuccess');
          } else {
              set({
                  feedbackMessage: `Not quite. Check your steps or calculation! You entered ${userAnswerNum}.`,
                  isAnswerCorrect: false
              });
              playSound('operationFail');
          }
      },

      applyOperationToBothSides: (operation, value) => {
        // --- Prevent operations if answer is already correct ---
        if (get().isAnswerCorrect) {
            set({ feedbackMessage: "You already found the correct answer!" });
            return;
        }
        
        if (get().isAnimating) return;

        const { leftCauldron, rightCauldron } = get();
        let newLeft = deepCopy(leftCauldron);
        let newRight = deepCopy(rightCauldron);
        let message = '';
        let status = 'success';

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
                    Object.keys(newLeft).forEach(key => newLeft[key] /= value);
                    Object.keys(newRight).forEach(key => newRight[key] /= value);
                     message = `Divided both sides by ${value}.`;
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            // Clean up zero coefficients
            Object.keys(newLeft).forEach(key => { if (Math.abs(newLeft[key]) < FLOAT_TOLERANCE) delete newLeft[key]; });
            Object.keys(newRight).forEach(key => { if (Math.abs(newRight[key]) < FLOAT_TOLERANCE) delete newRight[key]; });
             if (Object.keys(newLeft).length === 0) newLeft['_constant'] = 0;
             if (Object.keys(newRight).length === 0) newRight['_constant'] = 0;

            get()._updateState(newLeft, newRight, message, status);
        } catch (error) {
            console.error("Operation Error:", error);
            get()._updateState(
                deepCopy(leftCauldron),
                deepCopy(rightCauldron),
                `Error: ${error.message}`,
                'error'
            );
        }
      },

      // --- MODIFIED goToNextLevel ---
      goToNextLevel: () => {
        // Progression now depends ONLY on correct answer flag
        if (get().isAnswerCorrect) {
          const nextLevelIndex = get().currentLevelIndex + 1;
          get().loadLevel(nextLevelIndex);
        } else {
             set({ feedbackMessage: "Please enter the correct answer first!" });
             playSound('operationFail');
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
                  // Don't reset answer state on undo, just visual solved state
                  // isAnswerCorrect: false,
                  // userAnswer: '',
                  feedbackMessage: "Undo successful.",
                  leftCauldronStatus: 'idle',
                  rightCauldronStatus: 'idle',
                  showSymbolsTemporarily: false,
              });
          } else {
              set({ feedbackMessage: "Cannot undo further." });
              playSound('operationFail');
          }
      },
    }),
    {
      name: 'alchemist-workshop-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentLevelIndex: state.currentLevelIndex }),
      merge: (persistedState, currentState) => {
         if (persistedState && typeof persistedState.currentLevelIndex === 'number') {
            return {
                ...currentState,
                currentLevelIndex: persistedState.currentLevelIndex,
            };
         }
         return currentState;
      },
    }
  )
);
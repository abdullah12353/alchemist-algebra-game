// Define different ingredients visually (can be mapped to CSS classes or image URLs later)
export const ingredients = {
  x: { name: "Philosopher's Stone", symbol: '💎', color: 'bg-stone-gold' },
  _constant: { name: "Glow Shroom", symbol: '🍄', color: 'bg-potion-green' },
  y: { name: "Moon Dew", symbol: '💧', color: 'bg-blue-400' },
};

// --- 30 Levels ---
export const levels = [
  // --- Tier 1: Icon Only - Basic Add/Sub (Levels 1-5) ---
  { id: 1, initialEquation: "x + 1 = 4", targetVariable: "x", description: "Remove 1 Glow Shroom from each side." },
  { id: 2, initialEquation: "x + 3 = 5", targetVariable: "x", description: "Balance the Glow Shrooms." },
  { id: 3, initialEquation: "x - 2 = 1", targetVariable: "x", description: "Add 2 Glow Shrooms to balance." },
  { id: 4, initialEquation: "5 = x + 2", targetVariable: "x", description: "Isolate the Philosopher's Stone." },
  { id: 5, initialEquation: "x - 1 = -3", targetVariable: "x", description: "Balance with negative Shrooms." },

  // --- Tier 2: Icon Only - Basic Mult/Div (Levels 6-10) ---
  { id: 6, initialEquation: "2x = 6", targetVariable: "x", description: "Divide both sides by 2." },
  { id: 7, initialEquation: "4x = 12", targetVariable: "x", description: "How many Shrooms per Stone?" },
  { id: 8, initialEquation: "-3x = 9", targetVariable: "x", description: "Handle the negative Stone group." },
  { id: 9, initialEquation: "10 = 5x", targetVariable: "x", description: "Divide the Shrooms equally." },
  // { id: 10, initialEquation: "x / 2 = 3", targetVariable: "x", description: "Multiply both sides by 2." }, // Requires explicit multiply op if not present
   { id: 10, initialEquation: "1x = 4", targetVariable: "x", description: "Sometimes it's already simple!" }, // Simple case

  // --- Tier 3: Hybrid - Two-Step I (Levels 11-15) ---
  { id: 11, initialEquation: "2x + 1 = 7", targetVariable: "x", description: "First remove Shrooms, then divide." },
  { id: 12, initialEquation: "3x - 2 = 10", targetVariable: "x", description: "Add Shrooms first, then divide." },
  { id: 13, initialEquation: "5x + 5 = 15", targetVariable: "x", description: "Balance Shrooms, then Stones." },
  { id: 14, initialEquation: "1 = 2x - 5", targetVariable: "x", description: "Isolate the Stone group first." },
  { id: 15, initialEquation: "-x + 3 = 1", targetVariable: "x", description: "Handle the negative Stone." }, // Result x=2

  // --- Tier 4: Hybrid - Variables on Both Sides (Levels 16-20) ---
  { id: 16, initialEquation: "4x = 2x + 6", targetVariable: "x", description: "Group the Stones on one side." },
  { id: 17, initialEquation: "5x + 1 = 2x + 7", targetVariable: "x", description: "Group Stones, then Shrooms." },
  { id: 18, initialEquation: "3x - 4 = x + 2", targetVariable: "x", description: "Balance both ingredients." },
  { id: 19, initialEquation: "x = -2x + 9", targetVariable: "x", description: "Combine the Stone groups." },
  { id: 20, initialEquation: "2x - 3 = 4x - 7", targetVariable: "x", description: "Careful grouping needed!" }, // Result x=2

  // --- Tier 5: Symbol Only - Distribution & Fractions (Implicit) (Levels 21-25) ---
  // Note: True distribution (parentheses) isn't handled by parser, but similar results via steps
  { id: 21, initialEquation: "2(x + 1) = 8", targetVariable: "x", description: "Think: Divide by 2 first, or 2x + 2 = 8" }, // x=3
  { id: 22, initialEquation: "3(x - 2) = 3", targetVariable: "x", description: "Divide by 3, or 3x - 6 = 3" }, // x=3
  { id: 23, initialEquation: "10 = 5(x - 1)", targetVariable: "x", description: "Isolate the parenthesis group." }, // x=3
  { id: 24, initialEquation: "x / 2 + 1 = 5", targetVariable: "x", description: "Handle the fraction: Subtract 1, then multiply by 2." }, // x=8
  { id: 25, initialEquation: "(x / 3) - 2 = 1", targetVariable: "x", description: "Isolate the term with x." }, // x=9

  // --- Tier 6: Symbol Only - Complex / Edge Cases (Levels 26-30) ---
  { id: 26, initialEquation: "2x + 5 = 2x - 1", targetVariable: "x", description: "What happens when variables cancel?" }, // No solution (will result in 5 = -1)
  { id: 27, initialEquation: "3x + 4 = 3x + 4", targetVariable: "x", description: "What happens when everything cancels?" }, // Infinite solutions (will result in 4 = 4 or 0 = 0)
  { id: 28, initialEquation: "0.5x + 1 = 3", targetVariable: "x", description: "Work with decimals." }, // x=4
  { id: 29, initialEquation: "2(x + 1) = 3x - 1", targetVariable: "x", description: "Expand and solve: 2x + 2 = 3x - 1" }, // x=3
  { id: 30, initialEquation: "5 - x = 2x + 11", targetVariable: "x", description: "Final challenge!" }, // -3x = 6 -> x=-2
];

// --- Helper to find the true solution (basic solver) ---
// WARNING: This is a VERY basic solver for linear equations ax+b = cx+d
// It won't handle no/infinite solutions, parentheses, or complex fractions directly.
// It assumes the equation *has* a unique solution.
export const findSolution = (equationStr, targetVar) => {
    try {
        // Very simple heuristic parsing - assumes format like 'ax + b = cx + d'
        // This is NOT robust parsing.
        const sides = equationStr.split('=');
        if (sides.length !== 2) return null;

        const parseSide = (side) => {
            let varCoeff = 0;
            let constant = 0;
            // Match terms like +5x, -x, + 3, - 10, etc.
            const terms = side.match(/[+-]?\s*(\d*\.?\d*\*?\s*[a-zA-Z]|\d+\.?\d*)/g) || [];
            terms.forEach(term => {
                term = term.replace(/\s/g, ''); // Remove whitespace
                if (term.includes(targetVar)) {
                    let coeffStr = term.split(targetVar)[0];
                    if (coeffStr === '+' || coeffStr === '') coeffStr = '1';
                    if (coeffStr === '-') coeffStr = '-1';
                    varCoeff += parseFloat(coeffStr || '1'); // Default to 1 if just 'x'
                } else {
                    constant += parseFloat(term);
                }
            });
            return { varCoeff, constant };
        };

        const left = parseSide(sides[0]);
        const right = parseSide(sides[1]);

        // Rearrange to Ax = B
        const finalVarCoeff = left.varCoeff - right.varCoeff;
        const finalConstant = right.constant - left.constant;

        if (Math.abs(finalVarCoeff) < 1e-9) {
            // Variables cancelled - check if constants match (infinite) or not (no solution)
            return Math.abs(finalConstant) < 1e-9 ? Infinity : null; // Represent infinite/no solution
        }

        const result = finalConstant / finalVarCoeff;
        // Round slightly to handle potential floating point inaccuracies in simple cases
        return Math.round(result * 1e6) / 1e6;

    } catch (e) {
        console.error("Error finding solution for:", equationStr, e);
        return null; // Indicate error or unsolvable by this simple method
    }
};
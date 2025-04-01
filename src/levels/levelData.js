// Define different ingredients visually (can be mapped to CSS classes or image URLs later)
export const ingredients = {
  x: { name: "Philosopher's Stone", symbol: '💎', color: 'bg-stone-gold' },
  _constant: { name: "Glow Shroom", symbol: '🍄', color: 'bg-potion-green' },
  y: { name: "Moon Dew", symbol: '💧', color: 'bg-blue-400' }, // Keep if needed later
};

export const levels = [
  // Tier 1: Basic Addition/Subtraction
  { id: 1, description: "Isolate the Stone! Remove the Shrooms.", initialEquation: "x + 2 = 5", targetVariable: "x" },
  { id: 2, description: "Handle negative Shrooms.", initialEquation: "x - 3 = 1", targetVariable: "x" },
  { id: 3, description: "Start with the Stone on the right.", initialEquation: "6 = x + 4", targetVariable: "x" },
  { id: 4, description: "Result might be negative.", initialEquation: "x + 5 = 2", targetVariable: "x" },

  // Tier 2: Basic Multiplication/Division
  { id: 5, description: "Divide to isolate the Stone.", initialEquation: "3x = 12", targetVariable: "x" },
  { id: 6, description: "Handle negative coefficients.", initialEquation: "-2x = 10", targetVariable: "x" },
  { id: 7, description: "Division on the right side.", initialEquation: "15 = 5x", targetVariable: "x" },
  { id: 8, description: "Result might be zero.", initialEquation: "4x = 0", targetVariable: "x" },
  // { id: 9, description: "Fractional coefficient (requires careful division).", initialEquation: "x / 2 = 3", targetVariable: "x" }, // Requires multiply operation

  // Tier 3: Two-Step Equations (Add/Sub then Mult/Div)
  { id: 10, description: "Two steps needed: Subtract first.", initialEquation: "2x + 3 = 11", targetVariable: "x" },
  { id: 11, description: "Two steps: Add first.", initialEquation: "4x - 1 = 7", targetVariable: "x" },
  { id: 12, description: "Negative coefficient, two steps.", initialEquation: "-3x + 5 = -1", targetVariable: "x" },
  { id: 13, description: "Constant on the left.", initialEquation: "10 = 3x + 1", targetVariable: "x" },

  // Tier 4: Variables on Both Sides
  { id: 14, description: "Combine the Stones first.", initialEquation: "5x = 2x + 9", targetVariable: "x" },
  { id: 15, description: "Combine Stones and Shrooms.", initialEquation: "4x + 2 = x + 11", targetVariable: "x" },
  { id: 16, description: "Handle negatives on both sides.", initialEquation: "3x - 5 = 7x + 3", targetVariable: "x" },
  { id: 17, description: "More complex combination.", initialEquation: "-2x + 8 = 3x - 2", targetVariable: "x" },

  // Tier 5: More Complex / Edge Cases
  { id: 18, description: "Zero on one side.", initialEquation: "6x + 12 = 0", targetVariable: "x" },
  { id: 19, description: "No constant term initially.", initialEquation: "5x = 3x", targetVariable: "x" }, // Solution x=0
  { id: 20, description: "Final challenge!", initialEquation: "-x - 4 = -5x + 12", targetVariable: "x" },
  // Add more levels as needed
];
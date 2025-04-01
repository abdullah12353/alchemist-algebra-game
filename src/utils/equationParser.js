/**
 * Represents a side of an equation.
 * Keys are variable names ('x', 'y', etc.) or '_constant'.
 * Values are their coefficients.
 * Example: 2x + 3 => { x: 2, _constant: 3 }
 * Example: 5 => { _constant: 5 }
 * Example: -x => { x: -1 }
 */
export const parseTerm = (termStr) => {
  termStr = termStr.trim();
  if (!termStr) return { coefficient: 0, variable: null };

  let coefficient = 1;
  let variable = null;

  // Handle cases like just 'x' or '-x'
  if (termStr === 'x') return { coefficient: 1, variable: 'x' };
  if (termStr === '-x') return { coefficient: -1, variable: 'x' };

  // Match coefficient and variable
  const match = termStr.match(/(-?\d*\.?\d*)\s*\*?\s*([a-zA-Z])?/);
  // Improved regex to handle decimals and optional '*' for multiplication

  if (match) {
    const coeffStr = match[1];
    variable = match[2] || null; // Variable part

    if (coeffStr === '' || coeffStr === '+') {
      coefficient = 1;
    } else if (coeffStr === '-') {
      coefficient = -1;
    } else {
      coefficient = parseFloat(coeffStr); // Use parseFloat for decimals
    }

    // If only a number was found, it's a constant
    if (variable === null && !isNaN(coefficient)) {
       // It's a constant term
    } else if (variable === null && isNaN(coefficient)) {
        // This case should ideally not happen with valid input like '5' or 'x' or '2x'
        // If it's just a variable like 'x', the earlier check handles it.
        // If it's '-x', also handled. Let's assume invalid input if we reach here without a variable.
         console.warn(`Could not parse term: ${termStr}`);
         return { coefficient: 0, variable: null };
    }

  } else if (!isNaN(parseFloat(termStr))) {
      // Handle case where termStr is just a number like "5" or "-3.2"
      coefficient = parseFloat(termStr);
      variable = null;
  } else {
      console.warn(`Could not parse term: ${termStr}`);
      return { coefficient: 0, variable: null };
  }


  // If no variable was explicitly found, but we have a coefficient, it's a constant
  if (variable === null) {
      return { coefficient: coefficient, variable: '_constant'};
  }

  return { coefficient, variable };
};


export const parseEquationSide = (sideStr) => {
  const terms = {};
  // Use regex to split by '+' or '-' while keeping the sign with the term
  const termStrings = sideStr.match(/([+-]?\s*\d*\.?\d*\*?\s*[a-zA-Z]|[+-]?\s*\d*\.?\d+)/g) || [];

  termStrings.forEach(termStr => {
    const { coefficient, variable } = parseTerm(termStr.replace(/\s/g, '')); // Remove whitespace before parsing
    if (variable !== null) {
      const key = variable === '_constant' ? '_constant' : variable;
      terms[key] = (terms[key] || 0) + coefficient;
    } else if (!isNaN(coefficient)) { // Handle constants parsed without a variable key initially
        terms['_constant'] = (terms['_constant'] || 0) + coefficient;
    }
  });

  // Clean up zero coefficients, except for the constant if it's the only term
    for (const key in terms) {
        if (terms[key] === 0 && key !== '_constant') {
            delete terms[key];
        }
    }
     // Ensure _constant exists if the side is just 0 or empty
    if (Object.keys(terms).length === 0) {
        terms['_constant'] = 0;
    }


  return terms;
};

export const parseEquation = (equationStr) => {
  const sides = equationStr.split('=');
  if (sides.length !== 2) {
    throw new Error("Invalid equation format. Use 'left_side = right_side'.");
  }
  const left = parseEquationSide(sides[0]);
  const right = parseEquationSide(sides[1]);
  return { left, right };
};

// Helper to format a side back into a string (optional but useful for display)
export const formatEquationSide = (sideTerms) => {
    let parts = [];
    const variables = Object.keys(sideTerms).filter(k => k !== '_constant').sort();
    const constant = sideTerms['_constant'] || 0;

    variables.forEach(v => {
        const coeff = sideTerms[v];
        if (coeff === 0) return;
        let termStr = '';
        if (parts.length > 0) {
            termStr += coeff > 0 ? ' + ' : ' - ';
        } else if (coeff < 0) {
             termStr += '-';
        }
        const absCoeff = Math.abs(coeff);
        if (absCoeff !== 1) {
            termStr += absCoeff;
        }
        termStr += v;
        parts.push(termStr.replace(/^\s*\+\s*/, '')); // Remove leading '+' if first term
    });

    if (constant !== 0 || parts.length === 0) {
         if (parts.length > 0) {
             parts.push(constant > 0 ? ' + ' : ' - ');
             parts.push(Math.abs(constant).toString());
         } else {
             parts.push(constant.toString());
         }
    }


    return parts.join('').replace(/\s*\-\s*/g, ' - ').replace(/\s*\+\s*/g, ' + ').trim();
};
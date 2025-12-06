import { ShoppingItem } from "../types";

interface ParsedIngredient {
  quantity: number;
  unit: string;
  name: string;
}

const UNIT_MAP: Record<string, string> = {
  'cups': 'cup', 'cup': 'cup', 'c': 'cup',
  'tbsp': 'tbsp', 'tbs': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
  'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
  'lbs': 'lb', 'lb': 'lb', 'pounds': 'lb', 'pound': 'lb',
  'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
  'g': 'g', 'gram': 'g', 'grams': 'g',
  'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
  'l': 'l', 'liter': 'l', 'liters': 'l', 'lt': 'l',
  'clove': 'clove', 'cloves': 'clove',
  'slice': 'slice', 'slices': 'slice',
  'can': 'can', 'cans': 'can',
  'pinch': 'pinch', 'pinches': 'pinch',
  'piece': 'piece', 'pieces': 'piece',
  'bunch': 'bunch', 'bunches': 'bunch'
};

const normalizeUnit = (u: string): string => {
  const lower = u.toLowerCase().replace('.', '');
  return UNIT_MAP[lower] || lower;
};

const isUnit = (word: string): boolean => {
  return !!UNIT_MAP[word.toLowerCase().replace('.', '')];
};

export const parseIngredient = (text: string): ParsedIngredient => {
  const cleanText = text.trim();
  // Regex: 
  // Group 1: Number (integer, decimal, or fraction like 1/2)
  // Group 2: Rest of the string
  const numberRegex = /^(\d+(?:\.\d+)?|\d+\/\d+)\s*(.*)$/;
  const match = cleanText.match(numberRegex);

  if (!match) {
    // No quantity found at start. Assume quantity 1 for logic, but unit is empty.
    // e.g. "Salt" -> 1 unit of Salt
    return { quantity: 1, unit: '', name: cleanText.toLowerCase() };
  }

  let quantityStr = match[1];
  let rest = match[2];

  // Parse quantity
  let quantity = 0;
  if (quantityStr.includes('/')) {
    const [num, den] = quantityStr.split('/').map(Number);
    quantity = den !== 0 ? num / den : 0;
  } else {
    quantity = parseFloat(quantityStr);
  }

  // Try to extract unit from the first word of the rest
  const words = rest.split(/\s+/);
  let unit = '';
  let name = rest;

  if (words.length > 0) {
    const potentialUnit = words[0];
    if (isUnit(potentialUnit)) {
      unit = normalizeUnit(potentialUnit);
      name = words.slice(1).join(' ');
    }
  }

  return { quantity, unit, name: name.toLowerCase() };
};

export const mergeShoppingList = (currentItems: ShoppingItem[], newIngredients: string[]): ShoppingItem[] => {
  // Create a deep copy (of the array and objects) so we can mutate safely
  const mergedList = currentItems.map(item => ({ ...item }));

  newIngredients.forEach(newStr => {
    const parsedNew = parseIngredient(newStr);
    
    // Find matching, uncompleted item
    const matchIndex = mergedList.findIndex(item => {
      if (item.completed) return false;
      const parsedExisting = parseIngredient(item.text);
      // We consider it a match if names match (case-insensitive) and units match (normalized)
      return parsedExisting.name === parsedNew.name && parsedExisting.unit === parsedNew.unit;
    });

    if (matchIndex !== -1) {
      // Update existing item
      const existingItem = mergedList[matchIndex];
      const parsedExisting = parseIngredient(existingItem.text);
      const newQuantity = parsedExisting.quantity + parsedNew.quantity;
      
      // Reconstruct the string
      // Format quantity (remove unnecessary decimals)
      const qDisplay = Number.isInteger(newQuantity) 
        ? newQuantity.toString() 
        : newQuantity.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

      const unitDisplay = parsedNew.unit ? `${parsedNew.unit} ` : '';
      
      // Update text
      existingItem.text = `${qDisplay} ${unitDisplay}${parsedNew.name}`;
    } else {
      // Add new item
      mergedList.push({
        id: crypto.randomUUID(),
        text: newStr,
        completed: false
      });
    }
  });

  return mergedList;
};

export const stepKeys = ["menu", "quote", "craft", "staff", "production", "changes", "installation", "settlement"];

export const orders = [
  { id: "neighbourhood", price: 32000, size: "16 × 10", days: 8, materials: 8600, externalLabour: 5100, logistics: 2900, masterHours: 62, workshopHours: 50 },
  { id: "standard", price: 48000, size: "24 × 16", days: 7, materials: 12800, externalLabour: 7900, logistics: 4900, masterHours: 88, workshopHours: 72 },
  { id: "landmark", price: 68000, size: "32 × 20", days: 6, materials: 19600, externalLabour: 12600, logistics: 7800, masterHours: 126, workshopHours: 96 },
];

export const screens = [
  { key: "quote", options: [{ key: "low", effects: { basePrice: 42000, satisfaction: 8 } }, { key: "fair", effects: { basePrice: 48000, satisfaction: 4 } }, { key: "craft", effects: { basePrice: 56000, materials: 2200, masterHours: 12, craft: 10 } }] },
  { key: "craft", options: [{ key: "traditional", effects: { materials: 1400, masterHours: 18, workshopHours: 8, craft: 20 } }, { key: "hybrid", effects: { craft: 8 } }, { key: "prefab", effects: { materials: -1900, masterHours: -16, workshopHours: -8, craft: -12 } }] },
  { key: "staff", options: [{ key: "solo", effects: { externalLabour: -5400, masterHours: 24, energy: -25 } }, { key: "skilled", effects: { energy: -8 } }, { key: "apprentice", effects: { externalLabour: 1600, masterHours: 8, inheritance: 28, energy: -6 } }] },
  { key: "production", options: [{ key: "normal", effects: { energy: -18, satisfaction: 2 } }, { key: "overtime", effects: { masterHours: 8, energy: -30, satisfaction: 6 } }, { key: "simplify", effects: { masterHours: -10, materials: -700, craft: -10, satisfaction: -4, energy: -12 } }] },
  { key: "changes", options: [{ key: "free", effects: { materials: 300, masterHours: 8, satisfaction: 12 } }, { key: "charge", effects: { changeFees: 1500, materials: 300, masterHours: 8, satisfaction: 2 } }, { key: "decline", effects: { satisfaction: -14 } }] },
  { key: "installation", options: [{ key: "breaks", effects: { logistics: 600, masterHours: 2, energy: -12, safety: 16 } }, { key: "helpers", effects: { externalLabour: 1500, energy: -8, safety: 20 } }, { key: "rush", effects: { materials: 600, masterHours: 4, energy: -28, safety: -18 } }] },
];

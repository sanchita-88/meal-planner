const PRESETS = {
A: { breakfast: 0.30, lunch: 0.40, snack: 0.10, dinner: 0.20 },
B: { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 },
C: { breakfast: 0.30, lunch: 0.35, snack: 0.05, dinner: 0.30 }
};

exports.getPreset = (key = 'A') => {
const p = PRESETS[key] || PRESETS['A'];
return p;
};
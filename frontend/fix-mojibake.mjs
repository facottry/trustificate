import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Mojibake mapping: broken sequence -> correct character
const replacements = [
  // Em dash: â€" (C3 A2 E2 82 AC E2 80 9D) -> — (E2 80 94)
  [Buffer.from([0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0x9D]), Buffer.from([0xE2, 0x80, 0x94])],
  // Em dash variant: â€" (C3 A2 E2 82 AC E2 80 9C) -> — (E2 80 94)  
  [Buffer.from([0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x80, 0x9C]), Buffer.from([0xE2, 0x80, 0x94])],
  // En dash: â€" (C3 A2 E2 82 AC E2 80 93) -> – (E2 80 93)
  // Note: en dash mojibake is same pattern but different last byte
  // Right single quote: â€™ (C3 A2 E2 82 AC E2 84 A2) -> ' (E2 80 99)
  [Buffer.from([0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xE2, 0x84, 0xA2]), Buffer.from([0xE2, 0x80, 0x99])],
  // Left double quote: â€œ (C3 A2 E2 82 AC E2 80 9C) -> " (E2 80 9C)
  // Right double quote: â€ (C3 A2 E2 82 AC) -> " (E2 80 9D) — handled by context
  // Ellipsis: â€¦ (C3 A2 E2 82 AC C2 A6) -> … (E2 80 A6)
  [Buffer.from([0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC2, 0xA6]), Buffer.from([0xE2, 0x80, 0xA6])],
  // Right arrow: â†' (C3 A2 E2 80 A0 E2 80 99) -> → (E2 86 92)
  [Buffer.from([0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xE2, 0x80, 0x99]), Buffer.from([0xE2, 0x86, 0x92])],
  // Checkmark: âœ" (C3 A2 C5 93 E2 80 9C) -> ✔ (E2 9C 94)
  // Middle dot: Â· (C3 82 C2 B7) -> · (C2 B7)
  [Buffer.from([0xC3, 0x82, 0xC2, 0xB7]), Buffer.from([0xC2, 0xB7])],
  // Multiplication: Ã— (C3 83 E2 80" 97) -> × (C3 97)
  // Party popper emoji: ðŸŽ‰ -> 🎉
  // Rocket emoji: ðŸš€ -> 🚀
  // Search emoji: ðŸ" -> 🔍
  // Chart emoji: ðŸ"Š -> 📊
];

// For text-level replacements (after UTF-8 decode)
const textReplacements = [
  ['â€"', '\u2014'],   // em dash
  ['â€"', '\u2013'],   // en dash  
  ['â€™', '\u2019'],   // right single quote
  ['â€œ', '\u201C'],   // left double quote
  ['â€\u009D', '\u201D'], // right double quote
  ['â€¦', '\u2026'],   // ellipsis
  ['â†\u2019', '\u2192'], // right arrow
  ['âœ"', '\u2714'],   // checkmark ✔
  ['âœ\u201C', '\u2714'], // checkmark variant
  ['â‚¹', '\u20B9'],   // rupee sign ₹
  ['Â·', '\u00B7'],    // middle dot ·
  ['Ã—', '\u00D7'],    // multiplication ×
  ['ðŸŽ‰', '🎉'],     // party popper
  ['ðŸš€', '🚀'],     // rocket
  ['ðŸ"', '🔍'],      // search
  ['ðŸ"Š', '📊'],     // chart
];

function walkDir(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

let totalFixed = 0;
const files = [
  ...walkDir('src', '.tsx'),
  ...walkDir('src', '.ts'),
];

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [from, to] of textReplacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  }
  
  if (changed) {
    writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);

import { readFileSync, writeFileSync } from 'fs';

// Read the file
let content = readFileSync('components/MatchDetailsModal.tsx', 'utf8');

// Fix 1: Improve close button visibility
const oldButton = '<button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10 p-1 bg-gray-900/50 rounded-full" aria-label="Fechar modal">';
const newButton = '<button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-red-500 z-[110] p-2 bg-gray-900/90 hover:bg-gray-900 rounded-full transition-all duration-200 shadow-lg" aria-label="Fechar modal">';
content = content.replace(oldButton, newButton);

// Fix 2: Add participant counter tracking
const oldCode = "  const totalSlots = match.slots;";
const newCode = `  const totalSlots = match.slots;

  // Track participant count changes
  useEffect(() => {
    console.log('👥 MatchDetailsModal: filled_slots updated to', match.filled_slots);
  }, [match.filled_slots]);`;
content = content.replace(oldCode, newCode);

// Write back
writeFileSync('components/MatchDetailsModal.tsx', content, 'utf8');

console.log("✅ Fixes applied successfully!");

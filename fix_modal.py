import re

# Read the file
with open('components/MatchDetailsModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Improve close button visibility
old_button = r'<button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10 p-1 bg-gray-900/50 rounded-full" aria-label="Fechar modal">'
new_button = '<button onClick={onClose} className="absolute top-3 right-3 text-white hover:text-red-500 z-[110] p-2 bg-gray-900/90 hover:bg-gray-900 rounded-full transition-all duration-200 shadow-lg" aria-label="Fechar modal">'
content = content.replace(old_button, new_button)

# Fix 2: Add participant counter tracking
old_code = "  const totalSlots = match.slots;"
new_code = """  const totalSlots = match.slots;

  // Track participant count changes
  useEffect(() => {
    console.log('👥 MatchDetailsModal: filled_slots updated to', match.filled_slots);
  }, [match.filled_slots]);"""
content = content.replace(old_code, new_code)

# Write back
with open('components/MatchDetailsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixes applied successfully!")

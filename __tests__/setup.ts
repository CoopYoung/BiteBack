// Global test setup

// Silence console.warn in tests unless debugging
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Missing Supabase')) return;
  originalWarn(...args);
};

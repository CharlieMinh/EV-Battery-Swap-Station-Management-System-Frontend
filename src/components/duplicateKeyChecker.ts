// Script to check for duplicate keys in LanguageContext.tsx
// This file can be used temporarily to validate our fixes
import fs from 'fs';

interface KeyCount {
  [key: string]: number;
}

function findDuplicateKeys(): void {
  const content: string = fs.readFileSync('./components/LanguageContext.tsx', 'utf8');
  
  // Extract keys from both en and vi sections
  const keyPattern: RegExp = /'([^']+)':/g;
  let match: RegExpExecArray | null;
  const allKeys: string[] = [];
  
  while ((match = keyPattern.exec(content)) !== null) {
    allKeys.push(match[1]);
  }
  
  // Find duplicates
  const keyCount: KeyCount = {};
  const duplicates: string[] = [];
  
  allKeys.forEach((key: string) => {
    keyCount[key] = (keyCount[key] || 0) + 1;
    if (keyCount[key] === 2) {
      duplicates.push(key);
    }
  });
  
  if (duplicates.length > 0) {
    console.log('🔴 Duplicate keys found:');
    duplicates.forEach((key: string) => {
      console.log(`  - ${key}`);
    });
  } else {
    console.log('✅ No duplicate keys found!');
  }
  
  // Check if en and vi have the same keys
  const enKeys: string[] = [];
  const viKeys: string[] = [];
  
  // This is a simplified check - in a real scenario, you'd parse the object structure
  console.log('\n📊 Total keys found:', allKeys.length);
  console.log('Note: This count includes both en and vi translations');
}

// Run the check
findDuplicateKeys();
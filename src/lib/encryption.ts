
/**
 * Encryption and decryption utilities for the chat application
 * Uses a simple Caesar cipher for demonstration purposes
 */

// Simple Caesar cipher for demonstration
// In a production app, use a more secure encryption method
export const encryptMessage = (text: string, key: number = 7): string => {
  if (!text) return "";
  
  return text
    .split("")
    .map(char => {
      const code = char.charCodeAt(0);
      // Only encrypt letters, leave other characters as is
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        // For uppercase letters
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + key) % 26) + 65);
        }
        // For lowercase letters
        return String.fromCharCode(((code - 97 + key) % 26) + 97);
      }
      return char;
    })
    .join("");
};

export const decryptMessage = (encryptedText: string, key: number = 7): string => {
  if (!encryptedText) return "";
  
  // For decryption, we use 26 - key as the shift (or -key + 26 to ensure positive)
  const decryptKey = (26 - (key % 26)) % 26;
  return encryptMessage(encryptedText, decryptKey);
};

// Visual indicator that text is encrypted
export const isEncrypted = (text: string): boolean => {
  if (!text || text.length < 3) return false;
  
  // Simple heuristic: check if the text appears to be encrypted
  // This is just a basic check and not foolproof
  const englishFreq = 'etaoinsrhdlucmfywgpbvkjxqz';
  const textLower = text.toLowerCase();
  const letterCounts: Record<string, number> = {};
  
  // Count letter frequencies
  for (const char of textLower) {
    if (/[a-z]/.test(char)) {
      letterCounts[char] = (letterCounts[char] || 0) + 1;
    }
  }
  
  // Sort by frequency
  const letterFreq = Object.entries(letterCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([letter]) => letter)
    .join('');
  
  // Calculate a simple difference score with English letter frequency
  let score = 0;
  const minLength = Math.min(letterFreq.length, 6);
  for (let i = 0; i < minLength; i++) {
    if (englishFreq.indexOf(letterFreq[i]) > 10) {
      score++;
    }
  }
  
  return score >= 2; // If 2 or more of the top 6 letters are uncommon in English
};

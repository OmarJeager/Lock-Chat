
/**
 * Encryption and decryption utilities for the chat application
 * Uses a simple substitution cipher that makes text appear as normal conversation
 */

// Predefined pairs of phrases for "encryption"
const phrasePairs = [
  { original: "hello", encrypted: "how are you doing" },
  { original: "hi", encrypted: "nice to see you" },
  { original: "goodbye", encrypted: "talk to you later" },
  { original: "thanks", encrypted: "I appreciate that" },
  { original: "yes", encrypted: "absolutely" },
  { original: "no", encrypted: "I don't think so" },
  { original: "maybe", encrypted: "I'll consider it" },
  { original: "okay", encrypted: "sounds good to me" },
  { original: "sorry", encrypted: "I apologize for that" },
  { original: "please", encrypted: "would you mind" },
  { original: "what", encrypted: "I'm curious about" },
  { original: "when", encrypted: "at what time" },
  { original: "where", encrypted: "in which location" },
  { original: "why", encrypted: "for what reason" },
  { original: "how", encrypted: "in what manner" },
  { original: "can", encrypted: "is it possible to" },
  { original: "will", encrypted: "are you planning to" },
  { original: "should", encrypted: "do you think it's best to" },
  { original: "would", encrypted: "if possible, could you" },
  { original: "could", encrypted: "might you be able to" },
  { original: "happy", encrypted: "feeling joyful" },
  { original: "sad", encrypted: "feeling down" },
  { original: "angry", encrypted: "feeling frustrated" },
  { original: "tired", encrypted: "feeling exhausted" },
  { original: "excited", encrypted: "feeling thrilled" },
  { original: "scared", encrypted: "feeling frightened" },
  { original: "confused", encrypted: "not quite understanding" },
  { original: "surprised", encrypted: "taken aback by" },
  { original: "interested", encrypted: "intrigued by" },
  { original: "bored", encrypted: "not finding this engaging" },
  { original: "man", encrypted: "gentleman" },
  { original: "woman", encrypted: "lady" },
  { original: "friend", encrypted: "companion" },
  { original: "family", encrypted: "relatives" },
  { original: "work", encrypted: "professional duties" },
  { original: "school", encrypted: "educational institution" },
  { original: "home", encrypted: "residence" },
  { original: "food", encrypted: "cuisine" },
  { original: "drink", encrypted: "beverage" },
  { original: "money", encrypted: "financial resources" },
  { original: "time", encrypted: "temporal dimension" },
  { original: "day", encrypted: "24-hour period" },
  { original: "night", encrypted: "evening hours" },
  { original: "morning", encrypted: "early hours" },
  { original: "afternoon", encrypted: "post-meridiem period" },
  { original: "evening", encrypted: "twilight hours" },
  { original: "week", encrypted: "seven-day period" },
  { original: "month", encrypted: "lunar cycle" },
  { original: "year", encrypted: "annual period" },
  { original: "today", encrypted: "this very day" },
  { original: "tomorrow", encrypted: "the day after" },
  { original: "yesterday", encrypted: "the day before" },
  { original: "now", encrypted: "at this moment" },
  { original: "later", encrypted: "at a subsequent time" },
  { original: "soon", encrypted: "in the near future" },
  { original: "never", encrypted: "at no time" },
  { original: "always", encrypted: "at all times" },
  { original: "sometimes", encrypted: "on occasion" },
  { original: "often", encrypted: "frequently" },
  { original: "rarely", encrypted: "infrequently" },
  { original: "good", encrypted: "of high quality" },
  { original: "bad", encrypted: "of poor quality" },
  { original: "big", encrypted: "of substantial size" },
  { original: "small", encrypted: "of minimal dimensions" },
];

// Function to encrypt a message (transform to conversational text)
export const encryptMessage = (text: string): string => {
  if (!text) return "";
  
  let encryptedText = text.toLowerCase();
  
  // Replace words with their encrypted versions
  phrasePairs.forEach(pair => {
    const regex = new RegExp(`\\b${pair.original}\\b`, 'gi');
    encryptedText = encryptedText.replace(regex, pair.encrypted);
  });
  
  // If no substitutions were made, apply a simple transform
  if (encryptedText === text.toLowerCase()) {
    // If no match was found, use a default transformation to make it look like conversational text
    const words = text.split(' ').filter(word => word.trim().length > 0);
    
    if (words.length === 0) return text;
    
    const conversationalStarters = [
      "I was thinking about",
      "Have you considered",
      "I wonder if",
      "Did you know that",
      "It's interesting that",
      "I recently learned that",
      "Someone told me about",
      "I've been pondering",
      "Let me tell you about",
      "I'm curious about"
    ];
    
    const randomStarter = conversationalStarters[Math.floor(Math.random() * conversationalStarters.length)];
    encryptedText = `${randomStarter} ${text.toLowerCase()}`;
  }
  
  // Capitalize first letter
  return encryptedText.charAt(0).toUpperCase() + encryptedText.slice(1);
};

// Function to decrypt a message (transform back to original text)
export const decryptMessage = (encryptedText: string): string => {
  if (!encryptedText) return "";
  
  let decryptedText = encryptedText.toLowerCase();
  
  // Try to find direct matches first
  for (const pair of phrasePairs) {
    const regex = new RegExp(`\\b${pair.encrypted}\\b`, 'gi');
    if (regex.test(decryptedText)) {
      decryptedText = decryptedText.replace(regex, pair.original);
      return decryptedText; // Return early if a match is found
    }
  }
  
  // Handle conversational starters
  const conversationalStarters = [
    "i was thinking about ",
    "have you considered ",
    "i wonder if ",
    "did you know that ",
    "it's interesting that ",
    "i recently learned that ",
    "someone told me about ",
    "i've been pondering ",
    "let me tell you about ",
    "i'm curious about "
  ];
  
  for (const starter of conversationalStarters) {
    if (decryptedText.startsWith(starter)) {
      return decryptedText.substring(starter.length);
    }
  }
  
  // If no transformations were made, return original text
  return encryptedText;
};

// Visual indicator that text is encrypted
export const isEncrypted = (text: string): boolean => {
  if (!text || text.length < 3) return false;
  
  // Check if the text matches any of our encrypted phrases
  for (const pair of phrasePairs) {
    const regex = new RegExp(`\\b${pair.encrypted}\\b`, 'gi');
    if (regex.test(text.toLowerCase())) {
      return true;
    }
  }
  
  // Check if it starts with a conversational starter
  const conversationalStarters = [
    "i was thinking about",
    "have you considered",
    "i wonder if",
    "did you know that",
    "it's interesting that",
    "i recently learned that",
    "someone told me about",
    "i've been pondering",
    "let me tell you about",
    "i'm curious about"
  ];
  
  for (const starter of conversationalStarters) {
    if (text.toLowerCase().startsWith(starter)) {
      return true;
    }
  }
  
  return false;
};

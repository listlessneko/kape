import { logger } from '../logger.js';

const serviceName = 'FormatServices';
export const FormatServices = {
  isLowerCaseLetter(word) {
    const code = word.charCodeAt(0);
    return (code >= 97 && code <= 122);
  },

  isAnOpenBracket(word) {
    const code = word.charCodeAt(0);
    return (code === 40 || code === 90 || code === 123);
  },

  aOrAn(word, stylized={}) {
    const vowels = [ 'A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u' ];
    const firstLetterVowel = vowels.findIndex(vowel => vowel === word.charAt(0));
    if (stylized === 'italic') {
      return firstLetterVowel > -1 ? `an *${word}*` : `a *${word}*`;
    } if (stylized === 'bold') {
      return firstLetterVowel > -1 ? `an **${word}**` : `a **${word}**`;
    } else {
      return firstLetterVowel > -1 ? `an ${word}` : `a ${word}`;
    }
  },

  nameFormatter(string, splitter) {
    const functionName = `${serviceName}.nameFormatter`;
    logger.log(`[TEST] ${functionName} splitter:`, splitter);
    let newString = '';
    let elementalize = string.split(splitter);
    let properfy = elementalize.map(word => {
      if (this.isAnOpenBracket(word)) {
        return word.charAt(0) + word.charAt(1).toUpperCase() + word.slice(2);
      }
      if (this.isLowerCaseLetter(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    });
    return newString = properfy.join(' ');
  },

  capitalizeFirstLetter(string) {
    if (this.isLowerCaseLetter(string)) {
      return string.chartAt(0).toUpperCase() + string.slice(1);
    }
    return string
  },

  determineUnits(value) {
    return value > 1 || value < -1 ? 'credits' : value === 1 ? 'credit' : value > .01 || value < -0.1 ? 'parts' : value === .01 ? 'part' : 'credits';
  },

  generateCompositeKey(key1, key2) {
    return `${key1}:${key2}`
  }
}

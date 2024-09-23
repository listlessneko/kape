const FormatServices = {
  isLowerCaseLetter(word) {
    const code = word.charCodeAt(0);
    return (code >= 97 && code <= 122);
  },

  nameFormatter(string) {
    let newString = '';
    let elementalize = string.split('_');
    let properfy = elementalize.map(word => {
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

module.exports = {
  FormatServices
}

const FormatServices = {
    isLowerCaseLetter(char) {
      const code = char.charCodeAt(0);
      return (code >= 97 && code <= 120);
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

  determineUnits(value) {
    return value > 1 || value < -1 ? 'credits' : value === 1 ? 'credit' : value > .01 || value < -0.1 ? 'parts' : value === .01 ? 'part' : 'credits';
  }
}

module.exports = {
  FormatServices
}

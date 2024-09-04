const FormatServices = {
  determineUnits(value) {
    return value > 1 || value < -1 ? 'credits' : value === 1 ? 'credit' : value > .01 || value < -0.1 ? 'parts' : value === .01 ? 'part' : 'credits';
  }
}

module.exports = {
  FormatServices
}

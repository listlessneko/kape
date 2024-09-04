const FormatServices = {
  determineUnits(value) {
    return value > 1 ? 'credits' : value === 1 ? 'credit' : value > .01 ? 'parts' : 'part';
  }
}

module.exports = {
  FormatServices
}

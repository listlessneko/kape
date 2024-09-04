const MathServices = {
  isValidNumber(value) {
    return typeof value === 'number' && 
           !Number.isNaN(value) && 
           Number.isFinite(value)
  },

  roundTo2Decimals(value) {
   return Math.round(Number(value) * 100) / 100
  },

  formatNumber(number) {
    return (number >= 0 ? '+' : '') + number;
  },

  wholeNumber(value) {
    return value < 1 && value > 0 ? value * 100 : value;
  },

  addUpTo100(currentAmount, ...amount) {
    let result = currentAmount;

    for (const num of amount) {
      result += num;
      if (result >= 100) {
        console.log('Max 100 reached.');
        result = 100;
        return result;
      }
    }
    return this.roundTo2Decimals(result);
  },

  removeDownTo0(currentAmount, ...amount) {
    let result = currentAmount;

    for (const num of amount) {
      result -= num;
      if (result <= 0) {
        console.log('Min 0 reached.');
        result = 0;
        return result;
      }
    }
    return this.roundTo2Decimals(result);
  },

  removeDownToNegative100(currentAmount, ...amount) {
    let result = currentAmount;

    for (const num of amount) {
      result -= num;
      if (result <= -100) {
        console.log('Min 0 reached.');
        result = -100;
        return result;
      }
    }
    return this.roundTo2Decimals(result);
  }
}

module.exports = {
  MathServices
}

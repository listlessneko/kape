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

  formatEnergy(min, max) {
    min = (min >= 0 ? '+' : '') + min;
    max = (max >= 0 ? '+' : '') + max;
    return {
      min,
      max
    }
  },

  displayCurrency(value) {
    const funds = value < 1 && value > 0 ? value * 100 : value;
    const units = value > 1 || value < -1 ? 'credits' : value === 1 ? 'credit' : value > .01 || value < -0.1 ? 'parts' : value === .01 ? 'part' : 'credits';
    return {
      funds,
      units
    }
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
  },

  randomMultiple(min, max, interval) {
    const maxMultiples = max / interval;
    console.log('Math Services - Max Multiples:', maxMultiples);
    const minMultiples = min / interval;
    console.log('Math Services - Min Multiples:', minMultiples);
    const rangeSize = (maxMultiples - minMultiples) + 1;
    console.log('Math Services - Range Size:', rangeSize);
    const chance = Math.random();
    const fate = 5 * (Math.floor(chance * rangeSize) + minMultiples);
    console.log('Math Services - Chance:', chance);
    return {
      maxMultiples,
      minMultiples,
      rangeSize,
      fate
    };
  }
}

module.exports = {
  MathServices
}

const MathServices = {
  formatNumber(number) {
    return (number >= 0 ? '+' : '') + number;
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
    return result;
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
    return result;
  }
}

module.exports = {
  MathServices
}

import { logger } from '../logger.js';
import { ValidationServices } from './validation-services.js';
import { ErrorServices } from './error-services.js';

const serviceName = 'MathServices';
export const MathServices = {
  roundTo2Decimals(value) {
    const functionName = `${serviceName}.roundTo2Decimals`;

    try {
      ValidationServices.isValidNumber(value);
      return Math.round(Number(value) * 100) / 100
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  formatNumber(number) {
    const functionName = `${serviceName}.formatNumber`;

    try {
      ValidationServices.isValidNumber(number);
      return (number >= 0 ? '+' : '') + number;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  formatEnergy(min, max) {
    const functionName = `${serviceName}.formatEnergy`;

    try {
      ValidationServices.isValidNumber(min);
      ValidationServices.isValidNumber(max);

      min = (min >= 0 ? '+' : '') + min;
      max = (max >= 0 ? '+' : '') + max;

      return {
        min,
        max
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  displayCurrency(value) {
    const functionName = `${serviceName}.displayCurrency`;

    try {
      ValidationServices.isValidNumber(value);

      let amount = (value < 1 && value > 0) || (value > -1 && value < 0) ? value * 100 : value;
      const units = Math.abs(value) > 1 ? 'credits' : Math.abs(value) === 1  ? 'credit' : Math.abs(value) > 0.01 ? 'parts' : Math.abs(value) === 0.01 ? 'part' : 'credits';

      return {
        amount,
        units
      }

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  wholeNumber(value) {
    const functionName = `${serviceName}.wholeNumber`;

    try {
      ValidationServices.isValidNumber(value);

      return value < 1 && value > 0 ? value * 100 : value;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  addUpToMax(currentAmount, amount, max) {
    const functionName = `${serviceName}.addUpToMax`;

    try {
      ValidationServices.isValidNumber(currentAmount);
      ValidationServices.isValidNumber(amount);
      ValidationServices.isValidNumber(max);

      let result = currentAmount;

      result += amount;

      if (result >= max) {
        logger.info(`[INFO] ${functionName}: Max ${max} reached.`);
        result = max;
      }

      return result;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  removeDownToMin(currentAmount, amount, min) {
    const functionName = `${serviceName}.removeDownToMin`;

    try {
      ValidationServices.isValidNumber(currentAmount);
      ValidationServices.isValidNumber(amount);
      ValidationServices.isValidNumber(min);

      let result = currentAmount;
      result -= amount;

      if (result <= min) {
        logger.info(`[INFO] ${functionName}: Min '${min}' reached.`);
        result = min;
      }

      return result;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  removeDownToDebtLimit(currentAmount, amount, debtLimit) {
    const functionName = `${serviceName}.removeDownToDebtLimit`;

    try {
      const args = [currentAmount, amount, debtLimit];
      args.forEach(arg => {
        ValidationServices.isValidNumber(arg);
      });

      let result = currentAmount;

      if (result <= debtLimit) {
        logger.info(`[INFO] ${functionName}: Debt limit '${debtLimit}' reached.`);
        result = debtLimit;
      }

      return result;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  async calculateExpReq(level, prev_exp_req) {
    const functionName = `${serviceName}.calculateExpReq`;
    logger.debug(`[DEBUG] ${functionName} Level:`, level);
    logger.debug(`[DEBUG] ${functionName} Prev Exp Requirement:`, prev_exp_req);

    try {
      ValidationServices.isValidNumber(level);
      ValidationServices.isValidNumber(prev_exp_req);

      if (level === 0) {
        logger.info(`[INFO] ${functionName} Level: ${level}.`);
        return 50;
      }
      else if (level) {
        logger.info(`[INFO] ${functionName} Level: ${level}`);
        return level * 50 + prev_exp_req;
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  },

  /**
   * Returns a selection based on its weight value.
   * Probability (selection of an Option) = Weight of Option / Total Weight of Involved Options
   * - Helper math function intended for determining an energy_replen value when a range starting from negative and ending on a non-negative exists.
   * - However, can be used for any similar use cases.
   *
   * @param {array} options An array of options containing their weighted value along with other option details.
   * @returns {object} One object from the array based on its weighted value.
   *
   */

  getWeightedSelection(options) {
    const functionName = `${serviceName}.getWeightedSelection`;
    try {
      const totalWeight = options.reduce((acc, option) => acc + option.weight, 0);

      const fate = Math.random() * totalWeight;
      let cumulativeWeight = 0;

      for (let i = 0; i < options.length; i++) {
        cumulativeWeight += options[i].weight;
        if (fate < cumulativeWeight) {
          return options[i];
        }
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  },

  /**
   * Generates a range of objects with weighted values strongly in favor of negative numbers.
   * - Favors negative numbers with a weight of 5.
   * - Helper math function intended for determining an energy_replen value when a range starting from negative and ending on a non-negative exists.
   * - However, can be used for any similar use cases.
   *
   * @param {number} min The minimum value of the object.
   * @param {number} max The maximum value of the object.
   * @param {number} step The specified interval that determines the main number value of each object.
   *
   */

  generateNegativeWeightedArray(min, max, step) {
    const functionName = `${serviceName}.generateNegativeWeightedArray`;
    try {
      const range = [];
      for (let fate = min; fate <= max; fate += step) {
        if (fate < 0) {
          range.push({ fate, weight: 5});
        }
        else {
          range.push({ fate, weight: 1});
        }
      }
      return range;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  },

  /**
   * Generates a range of objects containing a fateful number and a weight property.
   * - Helper math function intended for determining an energy_replen value when a range starting from negative and ending on a non-negative exists.
   * - However, can be used for any similar use cases.
   *
   * @param {number} min The minimum value of the object.
   * @param {number} max The maximum value of the object.
   * @param {number} step The specified interval that determines the main number value of each object.
   *
   */

  generateWeightedArray(min, max, step) {
    const functionName = `${serviceName}.generateWeightedArray`;
    try {
      const range = [];
      for (let fate = min; fate <= max; fate += step) {
        range.push({fate, weight: 1});
      }
      return range;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  },

  /**
   * Readjusts the weighted value of each object based on its specified group's probability.
   * - Helper math function to create an array that will be used for getWeightedSelection(). The weights of each object determine its proability of being selected.
   * - Scaling Factor = Specified Probability for Group / (Current Weight of Group / Total Weight of All Groups)
   * - New Weight of Group = Scaling Factor * Current Weight of Group
   * - Probability = New Weight of Group / New Total Weight of All Groups
   *
   * @param {array} array An array of objects containing their weighted value and additional details.
   * @param {object} groups An object containing the names of each group, an expression describing their conditions, and their probabilities.
   * @returns {array} A new array of objects containing their adjusted weighted value and additional details.
   * @example
   * const array = [{fate: -10, weight: 5}, {fate: -5, weight: 5}, {fate: 0, weight: 1}, {fate: 5, weight: 1}, {fate: 10, weight: 1}, {fate: 15, weight: 1}, {fate: 20, weight: 1}]
   *
   * const groups = {
   *   group1: {
   *     condition: item => item.fate < 0,
   *     probability: .5
   *   },
   *   group2: {
   *     condition: item => item.fate === 0,
   *     probability: .1
   *   },
   *   group3: {
   *     condition: item => item.fate > 0,
   *     probability: .4
   *   },
   *
   *
   * const result = balanceProbabilities(array, groups);
   * console.log(result);
   *
   * // Logs: [{fate: -10, weight: 3.75}, {fate: -5, weight: 3.75}, {fate: 0, weight: 1.5}, {fate: 5, weight: 1.5}, {fate: 10, weight: 1.5}, {fate: 15, weight: 1.5}, {fate: 20, weight: 1.5}]
   *
   */

  balanceProbabilities(array, groups) {
    const functionName = `${serviceName}.balanceProbabilities`;
    try {
      const groupWeights = {};
      const totalWeight = array.reduce((sum, item) => {
        const groupName = Object.keys(groups).find(group => groups[group].condition(item));
        if (!groupWeights[groupName]) groupWeights[groupName] = 0;
        groupWeights[groupName] += item.weight;
        return sum += item.weight;
      }, 0);

      const scalingFactors = {};
      const totalProbabilities = Object.values(groups).reduce((sum, group) => sum + group.probability, 0)

      for (const group in groups) {
        const groupProbability = groups[group].probability / totalProbabilities;
        scalingFactors[group] = groupProbability / (groupWeights[group] / totalWeight);
      }

      array.forEach(item => {
        const groupName = Object.keys(groups).find(group => groups[group].condition(item));
        item.weight *= scalingFactors[groupName];
      });

      return array;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  },

  fatefulConsumption(kafeItem, quantity) {
    const functionName = `${serviceName}.lifeOrDeath`;

    const min = kafeItem.energy_replen.min;
    const max = kafeItem.energy_replen.max;
    const interval = 5;

    try {
      const array = this.generateWeightedArray(min, max, interval);

      const groups = {
        death: {
          condition: item => item.fate < 0,
          probability: .5
        },
        limbo: {
          condition: item => item.fate === 0,
          probability: .1
        },
        life: {
          condition: item => item.fate > 0,
          probability: .4
        },
      };

      const balancedArray = this.balanceProbabilities(array, groups);

      let fate = 0;

      for (let i = 0; i < quantity; i++) {
        const diff = this.getWeightedSelection(balancedArray);
        fate += diff.fate;
      }

      return fate;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
    }
  }

}

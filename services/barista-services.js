import { logger } from '../logger.js';
import { CacheServices } from './cache-services.js';
import { ErrorServices } from './error-services.js';

const serviceName = 'BaristaServices';

export const BaristaServices = {

  /**
   * Checks if all the modifications for a supply item has been completed.
   * - Helper function intended for Work.Barista command.
   *
   * @param {array} modifications A list of modifications each containing a status property.
   * @returns {object} An object containing the following:
   * - `noModification`: A boolean indicating whether or not the supply item has modifications.
   * - `modified`: A boolean indicating whether or not the supply item has been fully modified.
   * - `modifying`: A boolean indicating whether or not the supply item is currently going through modification.
   * - `unmodified`: A boolean indicating whether or not the supply item has modifications but has not started being modified.
   *
   */

  checkModificationStatus(modifications) {
    const functionName = `${serviceName}.modificationStatus`;
    logger.log(`[LOG] ${functionName} modifications:`, modifications);
    let modified = 0;
    let notModified = 0;

    if (modifications.length > 0) {
      for (const modification of modifications) {
      logger.log(`[TEST] ${functionName} modification.status:`, modification.status);
        modification.status ? modified += 1 : notModified += 1;
      }
    }
    logger.log(`[TEST] ${functionName} modified:`, modified);
    logger.log(`[TEST] ${functionName} notModified:`, notModified);
    return {
      noModification: modifications.length === 0 ? true : false,
      modified: notModified === 0 ? true : false,
      modifying: modified > 0 && notModified > 0 ? true : false,
      unmodified: modified === 0 ? true : false,
    }
  },

  /**
   * Checks for the current modification for the supply item that the barista is working on. Goes in order of array.
   * - Helper function intended for Work.Barista command.
   *
   */

  findCurrentModification(modifications) {
    const functionName = `${serviceName}.currentModification`;
    return modifications.find(modification => modification.status === false);
  },

  /**
   * If supplies are selected, will display the proper names of the items. Otherwise, will return a string indiciating none have been selected.
   * - Helper function intended for Work.Barista command.
   *
   * @param {array} chosenSupplies An array of the ingredients (or supplies) selected by the barista to attempt to create the order.
   * @returns A boolean indicating whether or not the order is correct.
   *
   */

  displaySelectedSupplies(chosenSupplies) {
    const functionName = `${serviceName}.displaySelectedSupplies`;
    logger.log(`[LOG] chosenSupplies:`, chosenSupplies);
    let displayChosenSupplies = '';
    if (chosenSupplies.length > 0) {
      for (const supply of chosenSupplies) {
        if (displayChosenSupplies === '') {
          displayChosenSupplies = `**${supply.displayItemName}**`;
        } else {
          displayChosenSupplies += `\n**${supply.displayItemName}**`;
        }
      }
    } else {
      displayChosenSupplies = '*None selected*';
    }
    return displayChosenSupplies;
  },

  /**
   * Checks if the barista selected the correct ingredients to create the customer's order.
   * - Helper function intended for Work.Barista command.
   *
   * @param {array} requiredSupplies An array of the required ingredients (or supplies) to successfully create the order.
   * @param {array} chosenSupplies An array of the ingredients (or supplies) selected by the barista to attempt to create the order.
   * @returns A boolean indicating whether or not the order is correct.
   *
   */

  createOrder(requiredSupplies, chosenSupplies) {
    const functionName = `${serviceName}.createOrder`;
    logger.log(`[LOG] ${functionName} requiredSupplies:`, requiredSupplies);
    logger.log(`[LOG] ${functionName} chosenSupplies:`, chosenSupplies);
    let requiredSuppliesDupe = [...requiredSupplies];
    let correct;
    for (let i = 0; i < requiredSupplies.length; i++) {
      const condition = supply => supply.name === requiredSupplies[i].name;
      const correctSupplyIdx = chosenSupplies.findIndex(condition);
      logger.log(`[TEST] ${functionName} correctSupplyIdx:`, correctSupplyIdx);
      const requiredSupplyDupeIdx = requiredSuppliesDupe.findIndex(condition)
      logger.log(`[TEST] ${functionName} requiredSupplyDupeIdx:`, requiredSupplyDupeIdx);
      if (requiredSupplyDupeIdx >= 0 && correctSupplyIdx >= 0) {
        requiredSuppliesDupe.splice(requiredSupplyDupeIdx, 1);
        chosenSupplies.splice(correctSupplyIdx, 1);
      }
    }
    if (requiredSuppliesDupe.length === 0 && chosenSupplies.length === 0) {
      correct = true;
    } else correct = false;
    logger.log(`[LOG] ${functionName} requiredSupplies:`, requiredSupplies);
    logger.log(`[LOG] ${functionName} chosenSupplies:`, chosenSupplies);
    return correct;
  },


  /**
   * Checks if the barista selected the correct ingredients to create the customer's order.
   * - Helper function intended for Work.Barista command.
   *
   * @param {RequiredSupplies} requiredSupplies An array of the required ingredients (or supplies) to successfully create the order.
   * @param {array} chosenSupplies An array of the ingredients (or supplies) selected by the barista to attempt to create the order.
   * @returns A boolean indicating whether or not the order is correct.
   *
   */

  advancedCreateOrder(requiredSupplies, chosenSupplies) {
    const functionName = `${serviceName}.advancedCreateOrder`;
    logger.log(`[LOG] ${functionName} requiredSupplies:`, requiredSupplies);
    logger.log(`[LOG] ${functionName} chosenSupplies:`, chosenSupplies);
    let accuracy = 0;
    let accurate = false;
    let precision = 0;
    let precise = false;
    let incorrect = false;

    let i = 0;

    for (const chosenSupply of chosenSupplies) {
      const excludingGroups = [ 'tea-leaves', 'syrups', 'powders', 'purées', 'fruits', 'sodas', 'other' ];
      const cannotBeSubstituted = excludingGroups.includes(chosenSupply.group);
      const preciselyAccurate = requiredSupplies.find(supply => supply.supply_item.id === chosenSupply.id);
      const somewhatAccurate = cannotBeSubstituted ? undefined : requiredSupplies.find(supply => supply.supply_item.group === chosenSupply.group);
      const accurateSupply = preciselyAccurate || somewhatAccurate;
      logger.log(`[LOG] ${functionName} chosenSupply.id:`, chosenSupply.id);
      const preciseSupply = requiredSupplies[i].name === chosenSupply.displayItemName;
      logger.log(`[LOG] ${functionName} chosenSupply.name:`, chosenSupply.name);

      if (accurateSupply) {
        accuracy += 1;
        logger.log(`[LOG] ${functionName} accuracy:`, accuracy);
      } if (preciseSupply) {
        precision += 1;
        logger.log(`[LOG] ${functionName} precision:`, precision);
      }
      i++;
    }

    if (accuracy === requiredSupplies.length) {
      accurate = true;
      logger.log(`[LOG] ${functionName} accurate:`, accurate);
    } if (precision === requiredSupplies.length) {
      precise = true;
      logger.log(`[LOG] ${functionName} precise:`, precise);
    } else {
      incorrect = true;
      logger.log(`[LOG] ${functionName} incorrect:`, incorrect);
    }
    return { accurate, precise, incorrect };
  },

  /**
   * Checks if the barista selected the correct ingredients to create the customer's order.
   * - Helper function intended for Work.Barista command.
   *
   * @param {RequiredSupplies} requiredSupplies An array of the required ingredients (or supplies) to successfully create the order.
   * @param {array} chosenSupplies An array of the ingredients (or supplies) selected by the barista to attempt to create the order.
   * @returns A boolean indicating whether or not the order is correct.
   *
   */

  veryAdvancedCreateOrder(requiredSupplies, chosenSupplies) {
    const functionName = `${serviceName}.advancedCreateOrder`;
    logger.log(`[LOG] ${functionName} requiredSupplies:`, requiredSupplies);
    logger.log(`[LOG] ${functionName} chosenSupplies:`, chosenSupplies);
    let accuracy = 0;
    let accurate = false;
    let precision = 0;
    let precise = false;
    let incorrect = false;

    let i = 0;

    for (const chosenSupply of chosenSupplies) {
      const excludingGroups = [ 'tea-leaves', 'syrups', 'powders', 'purées', 'fruits', 'sodas', 'other' ];
      const cannotBeSubstituted = excludingGroups.includes(chosenSupply.group);
      const preciselyAccurate = requiredSupplies[i].supply_item.id === chosenSupply.id;
      const somewhatAccurate = cannotBeSubstituted ? undefined : requiredSupplies[i].supply_item.group === chosenSupply.group;
      const accurateSupply = preciselyAccurate || somewhatAccurate;
      logger.log(`[LOG] ${functionName} chosenSupply.id:`, chosenSupply.id);
      const preciseSupply = requiredSupplies[i].name === chosenSupply.displayItemName;
      logger.log(`[LOG] ${functionName} chosenSupply.name:`, chosenSupply.name);

      if (accurateSupply) {
        accuracy += 1;
        logger.log(`[LOG] ${functionName} accuracy:`, accuracy);
      } if (preciseSupply) {
        precision += 1;
        logger.log(`[LOG] ${functionName} precision:`, precision);
      }
      i++;
    }

    if (accuracy === requiredSupplies.length) {
      accurate = true;
      logger.log(`[LOG] ${functionName} accurate:`, accurate);
    } if (precision === requiredSupplies.length) {
      precise = true;
      logger.log(`[LOG] ${functionName} precise:`, precise);
    } else {
      incorrect = true;
      logger.log(`[LOG] ${functionName} incorrect:`, incorrect);
    }
    return { accurate, precise, incorrect };
  },
}

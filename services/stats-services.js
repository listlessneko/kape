import { logger } from '../logger.js';
import { CacheServices } from './cache-services.js';
import { ErrorServices } from './error-services.js';
import {RelationshipLevelServices } from './relationship-level-services.js';

const serviceName = `StatsServices`;
export const StatsServices = {

  /**
   * @typedef {Object} Bouncer - Optional parameters for the operation.
   * @property {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @property {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @property {object} [bouncer.releases] - An object to release lock for specified entity.
   */

  /**
   * Retrieves barista's current stats.
   * - Primarily intended for a slash command to display stats.
   *
   * @param {string} userId The ID of the barista.
   * @param {Bouncer} bouncer Security.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `letTheRecordState`: The  barista's overall stats object, if retrieval successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   *
   */

  async getBaristaStats(userId, bouncer={}) {
    const functionName = `${serviceName}.getBaristaStats`;

    const targetModel = 'BaristaStats';
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.entries(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(guests, bouncer);
        localBouncer = true;
      }

      const entity = {
        targetModel,
        id: userId
      };

      let letTheRecordState = await CacheServices.getOrSetCacheEntry(entity, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return letTheRecordState;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * Track the number of orders a barista has made for general customers and add that to their overall number of completed orders.
   *
   * @param {string} baristaId The ID of the barista.
   * @param {object} results The results of the order completion.
   * @param {string} results.outcome A string indicating if the order was 'correct', 'acceptable', or 'incorrect'.
   * @param {string} results.exp The experience gained by the barista.
   * @param {string} results.cash The cash earned by the barista.
   * @param {Bouncer} bouncer Security.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `allTimeRecord`: The updated barista's overall stats object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async calculateBaristaWanderersOrders(baristaId, results, bouncer={}) {
    const functionName = `${serviceName}.calculateUserToNpccustomerOrders`;

    const indivEntity = {
      targetModel: 'BaristaStats',
      id: baristaId
    };
    const outcome = results.outcome + '_orders';
    const exp = results.rewards.exp;
    const cash = results.rewards.cash;

    let guests = {};
    let localBouncer = false;

    async function calculateResults(instance, bouncer) {
      instance[outcome] += 1;
      if (exp) instance.exp += exp;
      if (cash) instance.earnings += cash;
      await instance.save ({ transaction: bouncer.transaction });
    }

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [indivEntity.targetModel]: indivEntity.id
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let allTimeRecord = await CacheServices.getOrSetCacheEntry(indivEntity, bouncer);

      await calculateResults(allTimeRecord, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        allTimeRecord
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer)
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * Track the number of orders a barista has made for each unique customer and add that to their overall number of completed orders.
   *
   * @param {object} composite An object containing the identification details for the barista and customer.
   * @param {string} composite.theKey The composite key.
   * @param {object} composite.key1 An object containing the barista's information.
   * @param {string} composite.key1.id The ID of the barista.
   * @param {string} composite.key1.name The field name of the ID in the joint model.
   * @param {object} composite.key2 An object containing the customer's information.
   * @param {string} composite.key2.id The ID of the customer.
   * @param {string} composite.key2.name The field name of the ID in the joint model.
   * @param {object} results The results of the order completion.
   * @param {string} results.outcome A string indicating if the order was 'correct', 'acceptable', or 'incorrect'.
   * @param {string} results.exp The experience gained by the barista.
   * @param {string} results.cash The money earned by the barista.
   * @param {Bouncer} bouncer Security.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `vsCustomer`: The updated barista-customer stats object after the operation, if successful.
   * - `allTimeRecord`: The updated barista's overall stats object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async calculateUserToNpccustomerOrders(composite, results, bouncer={}) {
    const functionName = `${serviceName}.calculateUserToNpccustomerOrders`;

    const compositeModel = 'UserNpccustomerOrders';
    composite['targetModel'] = compositeModel;
    const indivModel = 'BaristaStats';
    const indivEntity = {
      targetModel: indivModel,
      id: composite.key1.id
    };
    const outcome = results.outcome + '_orders';
    const exp = results.rewards.exp;
    const cash = results.rewards.cash;

    let guests = {};
    let localBouncer = false;

    async function calculateResults(instance) {
      instance[outcome] += 1;
      if (exp) instance.exp += exp;
      if (cash) instance.earnings += cash;
      await instance.save ({ transaction: bouncer.transaction });
    }

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [compositeModel]: composite.theKey,
          [indivModel]: composite.key1.id
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let vsCustomer = await CacheServices.getOrSetCompositeCacheEntry(composite, bouncer);
      let allTimeRecord = await CacheServices.getOrSetCacheEntry(indivEntity, bouncer);

      await calculateResults(vsCustomer);
      await calculateResults(allTimeRecord);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        vsCustomer,
        allTimeRecord
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer)
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * @typedef {Object} Bouncer - Optional parameters for the operation.
   * @property {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @property {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @property {object} [bouncer.releases] - An object to release lock for specified entity.
   */

  /**
   * Adds results of a janken fight to fighter-npc's battle record and fighter's overall battle record.
   *
   * @param {object} composite An object containing the identification details for the two janken fighters.
   * @param {string} composite.theKey The composite key.
   * @param {object} composite.key1 An object containing the figther's information.
   * @param {string} composite.key1.id The ID of the fighter.
   * @param {string} composite.key1.name The field name of the ID in the joint model.
   * @param {object} composite.key2 An object containing the npc's information.
   * @param {string} composite.key2.id The ID of the npc.
   * @param {string} composite.key2.name The field name of the ID in the joint model.
   * @param {object} results The results of the janken battle.
   * @param {boolean} results.victory A boolean indicating whether or not the fighter won.
   * @param {boolean} results.defeat A boolean indicating whether or not the fighter lost.
   * @param {boolean} results.draw A boolean indicating whether or not battle ended in a draw.
   * @param {string} results.weapon The fighter's weapon of choice.
   * @param {number} results.energy_consumed The energy expended by the fighter.
   * @param {object} results.rewards An object containing the rewards for the fighter (if deserved).
   * @param {number} results.rewards.credits The credits (or parts) rewarded to the fighter.
   * @param {Bouncer} bouncer The referee.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `vsNpc`: The updated fighter-npc stats object after the operation, if successful.
   * - `letTheRecordState`: The updated fighter's overall stats object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   *
   */

  async calculateJankenStats(composite, results, bouncer={}) {
    const functionName = `${serviceName}.calculateJankenStats`;

    const compositeModel = `UserNpcJankenStats`;
    composite['model'] = compositeModel;
    const indivModel = 'JankenStats';
    const indivEntity = {
      model: indivModel,
      id: composite.key1.id
    };
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.entries(bouncer).length === 0) {
        guests = {
          [compositeModel]: composite.theKey,
          [indivModel]: composite.key1.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const vsNpc = await CacheServices.getOrSetCompositeCacheEntry(composite, bouncer);

      const letTheRecordState = await CacheServices.getOrSetCacheEntry(indivEntity, bouncer);

      const outcome = results.victory ? 'wins' : results.defeat ? 'losses' : 'draws';

      const weapon = results.weapon;

      const weapon_outcome = `${weapon}_${outcome}`;
      vsNpc[weapon_outcome] += 1;
      letTheRecordState[weapon_outcome] += 1;

      vsNpc.energy_spent += results.energy_consumed;
      letTheRecordState.energy_spent += results.energy_consumed;

      vsNpc.fortune += results.rewards.credits;
      letTheRecordState.fortune += results.rewards.credits;

      await vsNpc.save({ transaction: bouncer.transaction });

      await letTheRecordState.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, letTheRecordState, vsNpc };

    } catch (e) {
      logger.error(`[ERROR] ${functionName}: Failed to calculate Janken stats for User ${composite.key1.id} and NPC ${composite.key2.id}.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
    }
  },

  /**
   * Adds results of a fateful encounter to a traveler's history.
   *
   * @param {object} traveler Object containing ID of traveler.
   * @param {string} traveler.id ID of traveler.
   * @param {object} fate Object containing the results of the fateful encounter.
   * @param {string} fate.side The side of the coin chosen by the traveler.
   * @param {boolean} fate.lucky A boolean indicating whether or not the traveler chose correctly.
   * @param {boolean} fate.ultra_rare_plus A boolean indicating whether or not the gods were on the traveler's side.
   * @param {string} fate.coin The coin the traveler received.
   * @param {Bouncer} bouncer The guards.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `traveler`: The updated traveler object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   *
   */

  async calculateFateStats(traveler, fate, bouncer={}) {
    const functionName = `${serviceName}.calculateFateStats`;


    logger.log(`[LOG] ${functionName}: Beginning fate calculation...`);

    const model = 'FateStats';
    traveler['targetModel'] = model;
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.entries(bouncer).length === 0) {
        guests = {
          [model]: traveler.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
        logger.log(`[LOG] ${functionName}: Guests ID'd. Bouncer escorting...`);
      }

      const travelerStats = await CacheServices.getOrSetCacheEntry(traveler, bouncer);
      logger.log(`[LOG] ${functionName}: Cached traveler stats retrieved: ${!!travelerStats}`);

      const side = fate.side;

      const outcome = fate.ultra_rare_plus ? 'ultra_rare_plus' : fate.lucky ? 'lucky' : 'unlucky';

      let lucky_side = '';
      let unlucky_side = '';
      let ultra_lucky_side = '';

      let coin = fate.coin || null;

      logger.log(`[LOG] ${functionName}: Calculating fate...`);
      if (outcome !== 'ultra_rare_plus') {
        if (outcome === 'lucky') {
          lucky_side = 'lucky_' + side;
          travelerStats[lucky_side] += 1;
          travelerStats[coin] += 1;
        } else {
          unlucky_side = 'unlucky_' + side;
          travelerStats[unlucky_side] += 1;
        }
      } else if (outcome === 'ultra_rare_plus') {
        ultra_lucky_side = 'ultra_lucky_' + side;
        travelerStats[ultra_lucky_side] += 1;

        travelerStats[outcome] += 1;
        travelerStats[coin] += 1;
      }

      await travelerStats.save({ transaction: bouncer.transaction });
      logger.log(`[LOG] ${functionName}: Fate calculated.`);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        logger.log(`[LOG] ${functionName}: Guests escorted out. Bouncer on standby.`);
      }

      return { success: true, travelerStats };

    } catch (e) {
      logger.debug(`[DEBUG] ${functionName}: There was trouble with determining this traveler's fate.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.endAdvancedSquealOperations(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },
}

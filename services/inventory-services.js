import { logger } from '../logger.js';
import { AppError, ValidationError, NotFoundError, InsufficientResourcesError } from '../errors/error-barrel.js';
import { ValidationServices } from './validation-services.js';
import { sequelize } from '../data/db.js';
import * as Models from '../models/models-barrel.js';
import { client } from '../client.js';
import { MathServices } from './math-services.js';
import { UserServices } from './user-services.js';
import { UserKafeServices } from './user-kafe-services.js';
import { ErrorServices } from './error-services.js';
import { MutexServices } from './mutex-services.js';
import { CacheServices } from './cache-services.js';
import { BalanceServices } from './balance-services.js';

const serviceName = 'InventoryServices';
export const InventoryServices = {

  /**
   * @typedef {Object} Account
   * @property {string} id
   * @property {string} fieldName
   * @property {string} targetModel
   * @property {object} sourceModel
   * @property {string} sourceModel.name
   * @property {string} sourceModel.alias
   *
   */

  /**
   * @typedef {Object} StoreItem
   * @property {string} targetModel
   * @property {string} id
   *
   */

  /**
   * @typedef {Object} Bouncer - Optional parameters for the operation.
   * @property {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @property {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @property {object} [bouncer.releases] - An object to release lock for specified entity.
   */

  /**
   * Find item in specified store.
   *
   * @param {StoreItem} storeItem - Model name of specified store and ID of specified item.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `item`: The updated item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async findItem(storeItem, bouncer={}) {
    const functionName = `${serviceName}.findItem`;

    const targetModel = storeItem.targetModel;
    const id = storeItem.id;
    let guests = {};
    let localBouncer = false;

    try {

      if (Object.entries(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const cacheName = `${targetModel}Cache`;
      const Cache = CacheServices.findOrCreateCacheCollection(cacheName);

      let item = Cache.find(cachedItem => cachedItem.value === storeItem.value);
      //let item = CacheServices.getOrSetCacheEntry(storeItem, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer)
      }

      return item;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
      }
      throw e;
    }
  },

  /**
   * Adds specified item and item quantity to a global store.
   *
   * @param {StoreItem} storeItem - Model name of specified store and ID of specified item.
   * @param {number} quantity - Number of items to add.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `item`: The updated item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async addItemsToStore(storeItem, quantity, bouncer={}) {
    const functionName = `${serviceName}.addItemsToStore`;

    const targetModel = storeItem.targetModel;
    const id = storeItem.id;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.validateInputs({ targetModel, id });
      ValidationServices.isValidNumber(quantity);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let item = await CacheServices.getOrSetCacheEntry(storeItem, bouncer);

      const prev_item_quantity = item.quantity;
      item.quantity = await MathServices.addUpToMax(item.quantity, quantity, item.max_quantity);
      item.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.debug(`[DEBUG] ${functionName}: Item '${id}' removed from  '${targetModel}'.`);

      return { success: true, item, prev_item_quantity };

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
   * Removes specified item and item quantity to a global store.
   *
   * @param {StoreItem} storeItem - Model name of specified store and ID of specified item.
   * @param {number} quantity - Number of items to remove.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `item`: The updated item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async removeItemsFromStore(storeItem, quantity, bouncer={}) {
    const functionName = `${serviceName}.removeItemsFromStore`;

    const targetModel = storeItem.targetModel;
    const id = storeItem.id;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.validateInputs({ targetModel, id });
      ValidationServices.isValidNumber(quantity);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let item = await CacheServices.getOrSetCacheEntry(storeItem, bouncer);

      const prev_item_quantity = item.quantity;
      item.quantity = await MathServices.removeDownToMin(item.quantity, quantity, item.min_quantity);
      item.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.debug(`[DEBUG] ${functionName}: Item '${id}' removed from  '${targetModel}'.`);

      return { success: true, item, prev_item_quantity };

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
   * Retrieves an array of item references belonging to specified user stored in cache.
   *
   * @param {Account} account - Model name and ID of specified account.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object|null>} A promise that resolves to an array of items belonging to user.
   * @throws {Error} If expected or unexpected error occurs, yeet.
   */

  async getAccountItems(account, bouncer={}) {
    const functionName = `${serviceName}.getAccountItems`;

    const targetModel = account.targetModel;
    const id = account.id;
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let accountItems = await CacheServices.findEntryWithItems(account, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }
      return accountItems;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * Adds specified item and item quantity to a user's specified inventory.
   * - Intended for kafe related items.
   *
   * @param {Account} account - An object containing the ID of specified account, field name of the ID, the target model, and the source model name and alias.
   * @param {number} item - The item object.
   * @param {number} quantity - Number of items to add.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `userItem`: The updated user's item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async addItemsToAccount(account, item, quantity, bouncer={}) {
    const functionName = `${serviceName}.addItemsToAccount`;

    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(quantity);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [account.targetModel]: account.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userItems = await CacheServices.findEntryWithItems(account, bouncer);
      let userItem = userItems.items.find(userItem => userItem.item_id === item.id);
      logger.debug(`[DEBUG] ${functionName} userItem:`, userItem);

      if (!userItem) {
        logger.info(`[INFO] ${functionName}: ${account.targetModel} of User '${account.id}' does not have Item '${item.id}'.`);
        let newUserItem = await CacheServices.addNewItemToEntry(account, item, bouncer);
        logger.debug(`[DEBUG] ${functionName} New User Item:`, newUserItem.success);
        const newUserItems = await CacheServices.findEntryWithItems(account, bouncer);
        //logger.debug(`[DEBUG] ${functionName} New User Items:`, newUserItems);
        userItem = newUserItems.items.find(userItem => userItem.item_id === item.id);
        logger.debug(`[DEBUG] ${functionName} userItem:`, userItem);
      }

      userItem.quantity += quantity;
      // need to pull from model and set new updated list of items to cache
      //const Cache = await CacheServices.findOrCreateCacheCollection(account.model);
      await userItem.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        logger.log(`[LOG] ${functionName}: Bouncer escorted guests.`);
      }

      logger.debug(`[DEBUG] ${functionName}: Item '${item.id}' added to User '${account.id}'s ${account.targetModel} inventory.`);

      return { success: true, userItem };

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, depository, userId, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * Removes specified item and item quantity from a user's specified inventory.
   * - Intended for kafe related items.
   *
   * @param {Account} account - Model name and ID of specified account.
   * @param {number} item - The item object.
   * @param {number} quantity - Number of items to remove.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `userItem`: The updated user's item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async removeItemsFromAccount(account, item, quantity, bouncer={}) {
    const functionName = `${serviceName}.removeItemsFromAccount`;

    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(quantity);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [account.targetModel]: account.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      logger.debug(`[DEBUG] ${functionName} item:`, item);
      const userItems = await CacheServices.findEntryWithItems(account, bouncer);
      let userItem = userItems.items.find(userItem => userItem.item_id === item.id);

      if (!userItem) {
        throw new NotFoundError(`Item '${item.id}'`, `User '${account.id}'s ${account.targetModel} inventory`);
      }

      if (userItem.quantity < quantity) {
        throw new InsufficientResourcesError(depository, userItem.name, 'items');
      }

      userItem.quantity = await MathServices.removeDownToMin(userItem.quantity, quantity, userItem.min_quantity);
      await userItem.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.debug(`[DEBUG] ${functionName}: Item '${item.id}' removed from User '${account.id}'s ${account.targetModel} inventory.`);

      return { success: true, userItem };

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
   * Transfers specified item and item quantity from a global depository to user's specified inventory.
   * - Intended for kafe related items.
   *
   * @param {StoreItem} storeItem - Model name of specified store and ID of specified item.
   * @param {Account} account - Model name and ID of specified account.
   * @param {number} quantity - Number of items to transfer.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `item`: The updated item object after the operation, if successful.
   * - `userItem`: The updated user's item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, 
   * returns `success: false` and `reason: e.message`.
   */

  async transferItemsToUser(storeItem, account, quantity, bouncer={}) {
    const functionName = `${serviceName}.transferItemsToUser`;

    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [storeItem.targetModel]: storeItem.id,
          [account.targetModel]: account.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let removedItem = await this.removeItemsFromStore(storeItem, quantity, bouncer);

      const totalCost = removedItem.item.cost * quantity;
      logger.debug(`[DEBUG] ${functionName} Total Cost: ${totalCost}`);

      let accountBalance = await BalanceServices.deduct(account, amount, bouncer);

      logger.info(`[INFO] ${functionName}:\ntotalCost: ${totalCost}\nuser.balance: ${accountBalance.balance} (sufficient)`);

      let accountItem = await this.addItemsToAccount(account, removedItem.item, quantity, bouncer);

      if (localBouncer) {
        bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      const funds = MathServices.displayCurrency(totalCost);
      logger.log(`[LOG] ${functionName}: User ${userId} bought ${quantity} ${itemId} (${funds.amount, funds.units})`);

      return { success: true, accountItem, removedItem };

    } catch (e) {
      logger.error(`[ERROR] ${functionName}: Failed to transfer items from '${itemDepository}' to User '${userId}'s inventory.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

  /**
   * Decreases user's kafe supply item by specified amount.
   * - Helper function for 'UserServices.processSuppliesForOrder' (intended to be used for
   * each required supply item)
   *
   * @param {object} item - User's kafe supply item object being decreased.
   * @param {number} amount - Amount of item to be decreased.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `carryoverAmount` - A number that is leftover for next supply item of same `type`, if applicable.
   * - `quantityDecreased` - A boolean indicating whether or not the supply item was decreased.
   * - `quantityDepleted` - A boolean indicating whether or not the supply item was depleted.
   * @throws {Error} If an expected or unexpected error occurs, yeet.
   */

  async decreaseUserKafeSupplyItem(item, amount, bouncer={}) {
    const functionName = `${serviceName}.decreaseUserKafeSupplyItem`;

    let carryoverAmount;
    let quantityDecreased;
    let quantityDepleted;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        const model = item.constructor.name;
        logger.debug(`[DEBUG] ${functionName} model:`, model);
        guests = {
          [model]: item.user_id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      if (item.amount > amount && item.quantity > 0) {
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.type}' amount is sufficient.`);
        logger.debug(`[DEBUG] ${functionName}: '${item.type}' amount required is ${amount}.`);
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' amount is ${item.amount}.`);
        item.amount -= amount;
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' amount decreased from ${item.amount + amount} to ${item.amount}.`);
        quantityDecreased = true;
      }

      else if (item.amount <= amount && item.quantity === 1) {
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' amount less than sufficient.`);
        logger.debug(`[DEBUG] ${functionName}: ${item.type} amount required is ${amount}.`);
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.type}' amount is ${item.amount}.`);
        carryoverAmount = amount - item.amount;
        item.amount = 0;
        item.quantity -= 1;
        quantityDecreased = true;
        quantityDepleted = true;
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' fully depleted.`);
      }

      else if (item.amount <= amount && item.quantity > 1) {
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' amount less than sufficient.`);
        logger.debug(`[DEBUG] ${functionName}: ${item.type} amount required is ${amount}.`);
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.type}' amount is ${item.amount}.`);
        carryoverAmount = amount - item.amount;
        logger.debug(`[DEBUG] ${functionName}: Carryover amount is ${carryoverAmount}`);
        item.quantity -= 1;
        item.amount = item.max_amount - carryoverAmount;
        carryoverAmount = 0;
        quantityDecreased = true;
        logger.debug(`[DEBUG] ${functionName}: User Item '${item.name}' quantity decreased from ${item.quantity + 1} to ${item.quantity} and amount reset to ${item.amount}.`);
      }

      else {
        throw new InsufficientResourcesError(`User '${item.user_id}`, `${item.type}`, 'supplies');
      }

      await item.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.debug(`[DEBUG] ${functionName}: Cache updated.`);
      logger.log(`[LOG] ${functionName}: User Item '${item.name}' succesfully decremented.`);
      return { success: true, item, carryoverAmount, quantityDecreased, quantityDepleted };
    } catch (e) {
      logger.error(`[ERROR] ${functionName}: Failed to process '${item.type}'.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
      }
      throw e;
    }
  },

  /**
   * Sorts through user's kafe supplies for required supply item based on `type` property 
   * to create part of specified kafe item.
   * - Helper function for 'UserServices.createKafeOrder' (intended to be used for 
   * each required supply item)
   *
   * @param {string} userId - ID of specified user.
   * @param {object} itemRequired - Item object containing the `type` property and amount.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `userItem`: The user kafe supply item object used after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If an expected or unexpected error occurs, yeet.
   */

  async processSuppliesForOrder(userId, itemRequired, bouncer={}) {
    const functionName = `${serviceName}.processSuppliesForOrder`;
    logger.debug(`[DEBUG] ${functionName} userId:`, userId);

    const targetModel = 'UserKafeSupplies';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const accountEntity = {
        targetModel,
        id: userId
      };
      const cachedUserSupplies = await CacheServices.findEntryWithItems(accountEntity, bouncer);
      const filteredCachedUserItems = cachedUserSupplies.items.filter(userItem => userItem.type === itemRequired.type);

      if (filteredCachedUserItems.length === 0) {
        throw new InsufficientResourcesError(`User ${userId}`, itemRequired.type, 'items');
      }

      let sortedUserItems = filteredCachedUserItems.sort((a, b) => a.max_amount - b.max_amount);
      logger.debug(`[DEBUG] ${functionName} Sorted User Items Length:`, sortedUserItems.length);

      let carryoverAmount = itemRequired.amount;

      for (let i = 0; i < sortedUserItems.length; i++) {
        let userItem = sortedUserItems[i];
        //logger.debug(`[DEBUG] ${functionName} User Item Index:`, i);
        //logger.debug(`[DEBUG] ${functionName} User Item Amount:`, userItem.amount);
        if (userItem.amount <= 0) {
          logger.warn(`[WARNING] ${functionName}: User '${userItem.user_id}' no longer has stock of  '${userItem.name}'.`);
          continue;
        }
        if (carryoverAmount > 0) {
          const results = await this.decreaseUserKafeSupplyItem(userItem, carryoverAmount, bouncer);
          carryoverAmount = results.carryoverAmount;
        }
        else {
          break;
        }
      }

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.log(`[LOG] ${functionName}: User Item '${itemRequired.type}' successfully processed.`);
      return { success: true, userItem };
    } catch (e) {
      logger.error(`[ERROR] ${functionName}: Failed to process '${itemRequired.type}'.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
      }
      throw e;
    }
  },

  /**
   * Creates a specified kafe item using user's kafe supplies.
   *
   * @param {string} userId - ID of specified user.
   * @param {string} itemId - ID of specified item.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `item`: The created kafe item object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async createKafeOrder(userId, itemId, bouncer={}) {
    const functionName = 'InventoryServices.createKafeOrder';

    const targetModel = 'UserKafeSupplies';
    const itemModel = 'Items';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.validateInputs({ userId, itemId });

      const itemEntity = {
        targetModel: itemModel,
        id: itemId
      };

      let item = await CacheServices.getOrSetCacheEntry(itemEntity); // returns cached instance of model
      logger.debug(`[DEBUG] ${functionName} Kafe Item: ${item.name}`);

      const suppliesRequired = item.supplies_required; // returns an array
      logger.debug(`[DEBUG] ${functionName} Supplies Required:`, suppliesRequired);
      ValidationServices.validateInputs({ suppliesRequired });

      if (Object.keys(bouncer).length === 0) {
        logger.debug(`[DEBUG] ${functionName} Opts:`, bouncer);
        guests = {
          [targetModel]: userId,
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      for (let supplyItemRequired of suppliesRequired) {
        logger.debug(`[DEBUG] ${functionName} Type of Supply:`, supplyItemRequired);
        await this.processSuppliesForOrder(userId, supplyItemRequired, bouncer); // if user has supplies, decrements user supplies as needed
      }

      if (localBouncer) {
        bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      logger.log(`[LOG] ${functionName}: ${item.name} successfully created.\nSupplies Used:\n`, suppliesRequired);
      return { success: true, item };
    } catch (e) {
      logger.error(`[ERROR] ${functionName}: Failed to create '${item.name}'.`);
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
      }
      return { success: false, reason: e.message };
    }
  }
}

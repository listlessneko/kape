import { logger } from '../logger.js';
import { Collection } from 'discord.js';
import { Op } from 'sequelize';
import { AppError, ValidationError, NotFoundError, InsufficientResourcesError } from '../errors/error-barrel.js';
import { ValidationServices } from './validation-services.js';
import * as Models from '../models/models-barrel.js';
import { client } from '../client.js';
import { FormatServices } from './format-services.js';
import { ErrorServices } from './error-services.js';
import { sequelize } from '../data/db.js';
import { MutexServices } from './mutex-services.js';
import { MathServices } from './math-services.js';

const serviceName = 'CacheServices';
export const CacheServices = {

  /**
   * Loops through all created cache and prints them to console.
   *
   */

  async printCache() {
    for (let cacheName in client.cache) {
      console.log('Print Cache - Cache Name:', cacheName);
      console.log('Print Cache - Cache:', client.cache[cacheName]);
    }
  },

  /**
   * Clears all cache (except 'commands', 'cooldowns', and 'menu') of data.
   * - Intended for cron job that runs every 24 hours.
   *
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async clearAllCache() {
    const functionName = `${serviceName}.clearAllCache`;

    const excludedCache = ['commands','cooldowns', 'menus'];

    try {
      for (let cacheName in client.cache) {
        if (!excludedCache.includes(cacheName)) {
          let remove = 'Cache';
          const mutexName = cacheName.replace(remove, '');
          const Mutexes = MutexServices.findOrCreateMutexMap(mutexName);
          Mutexes.forEach(async mutex => {
            if (mutex.isLocked()) {
              await mutex.waitForUnlock();
            }
          });

          const globalMutex = MutexServices.getOrSetMutex('global', mutexName);
          const globalRelease = await globalMutex.acquire();
          logger.debug(`[DEBUG] ${functionName} Global Mutex for '${cacheName}' acquired:`, globalMutex.isLocked());
          client.cache[cacheName].clear();
          logger.log(`[LOG] ${functionName}: Cache for ${cacheName} has been cleared.`);

          globalRelease();
          logger.debug(`[DEBUG] ${functionName}: Mutex for ${cacheName} is released`, globalMutex.isLocked());
        }
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  /**
   * Finds or creates a cache collection.
   * - Cache name must be valid.
   *
   * @param {string} cacheName Name of specified cache.
   * @returns {Promise<Collection>} A collection of all stored data relevant to its name.
   * @throws {Error} If an error occurs, then it is thrown.
   * - Intended to be used within another function.
   *
   */

  async findOrCreateCacheCollection(cacheName) {
    const functionName = `${serviceName}.findOrCreateCacheCollection`;

    try {
      logger.debug(`[DEBUG] ${functionName} cacheName:`, cacheName);
      ValidationServices.validateCache(cacheName);
      logger.debug(`[DEBUG] ${functionName} cacheName validated.`);

      let CacheCollection = client.cache[cacheName];

      if (!CacheCollection) {
        CacheCollection = client.cache[cacheName] = new Collection();
      logger.debug(`[DEBUG] ${functionName} cacheCollection created.`);
      }

      //logger.debug(`[DEBUG] ${functionName} Cache collection retrieved:`, CacheCollection);
      return CacheCollection;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      logger.error(`[ERROR] ${functionName} stack:`, e.stack);
      throw e;
    }
  },

  /**
   * Searches for an entry in cache. If no entry, then searches within relevant model.
   *
   * @param {Object} entity The specified entity containing the model and its ID.
   * @param {string} entity.targetModel The model where the entity lives.
   * @param {string} entity.id The ID of the entity.
   * @param {object} [bouncer={}]  - Optional parameters for the operation
   * - Required if interacting with database.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @param {object} [bouncer.releases] - An object to release lock for specified entity.
   * @returns {Promise<object>} A promise that resolves to an object containing the cached reference.
   * @throws {Error} If local bouncer and an expected or unexpected error occurs,
   * @returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async getOrSetCacheEntry(entity, bouncer={}) {
    const functionName = `${serviceName}.getOrSetCacheEntry`;
    logger.debug(`[DEBUG] ${functionName} Model: ${entity.targetModel}`);

    const entityId = entity.id;
    const entityModel = entity.targetModel;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.validateInputs({ entityModel, entityId });

      const cacheName = entityModel + 'Cache';
      const Cache = await this.findOrCreateCacheCollection(cacheName);

      let cachedEntry = Cache.get(entityId);

      if (!cachedEntry) {
        logger.debug(`[DEBUG] ${functionName}: Entry '${entityId}' not found in Cache '${cacheName}'.`);
        if (Object.keys(bouncer).length === 0) {
          guests = {
            [entityModel]: entityId
          }
          bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
          localBouncer = true;
        }
        const Model = Models[entityModel];
        let [instance, created] = await Model.findOrCreate({
          where: {
            id: entityId
          },
            transaction: bouncer.transaction 
          });
        if (created) {
          logger.debug(`[DEBUG] ${functionName}: Entry '${entityId}' added to Database '${entityModel}'.`);
        } else {
          logger.debug(`[DEBUG] ${functionName}: Entry '${entityId}' found in Database '${entityModel}.'`);
        }

        if (localBouncer) {
          bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        }

        Cache.set(entityId, instance);
        logger.debug(`[DEBUG] ${functionName}: Entry '${entityId}' added to Cache '${cacheName}'.`);
        cachedEntry = Cache.get(entityId);
        //logger.debug(`[DEBUG] ${functionName} cachedEntry:`, cachedEntry);
        //logger.debug(`[DEBUG] ${functionName} cachedEntry model name:`, cachedEntry.constructor.name);
        return cachedEntry;
      }
      logger.debug(`[DEBUG] ${functionName}: Entry '${entityId}' found in Cache '${cacheName}'.`);
      return cachedEntry;
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
   * Searches for an entry in cache. If no entry, then searches within relevant model.
   *
   * @param {string} model The model we're looking into.
   * @returns {Promise<object>} A promise that resolves to an object containing the cached reference.
   * @throws {Error} If local bouncer and an expected or unexpected error occurs,
   * @returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async findAll(model) {
    const functionName = `${serviceName}.findAll`;

    let guests = {};
    let localBouncer = false;

    try {
      const transaction = await sequelize.transaction();
      const Model = Models.model;
      const allItems = await Model.findAll({ transaction });
    } catch (e) {

    }
  },

  /**
   * Searches for a compositen entry in cache. If no entry, then searches within relevant model.
   *
   * @param {Object} composite The specified entity containing the model
   * and the ID information of the two interacting entities.
   * @param {string} composite.theKey The ID of the entity.
   * @param {string} composite.targetModel The model where the entity lives.
   * @param {Object} composite.key1 The ID and field name of one-half of the composite key.
   * @param {string} composite.key1.id The id of one-half of the composite key.
   * @param {string} composite.key1.id_name The field name of one-half of the composite key.
   * @param {Object} composite.key2 The ID and field name of one-half of the composite key.
   * @param {string} composite.key2.id The id of one-half of the composite key.
   * @param {string} composite.key2.id_name The field name of one-half of the composite key.
   * @param {object} [bouncer={}]  - Optional parameters for the operation
   * - Required if interacting with database.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified entities.
   * @param {object} [bouncer.releases] - An object to release lock for specified entities.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `entity`: The updated entry object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local bouncer and an expected or unexpected error occurs,
   * @returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async getOrSetCompositeCacheEntry(composite, bouncer={}) {
    const functionName = `${serviceName}.getOrSetCompositeCacheEntry`;

    let compositeModel = composite.targetModel;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.validateInputs({ compositeModel });

      const cacheName = compositeModel + 'Cache';
      const Cache = await this.findOrCreateCacheCollection(cacheName);
      const Model = Models[compositeModel];

      let cachedComposite = Cache.get(composite.theKey);

      if (!cachedComposite) {
        logger.warn(`[WARNING] ${functionName}: Composite Key '${composite.theKey}' not found in Cache '${cacheName}'.`);

        if (Object.keys(bouncer).length === 0) {
          guests = {
            [compositeModel]: composite.theKey
          }
          bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests, composite);
          localBouncer = true;
        }

        const id1 = composite.key1.id;
        const id2 = composite.key2.id;

        let [instance, created] = await Model.findOrCreate({
          where: {
            id: `${composite.theKey}`,
          },
          defaults: {
            [composite.key1.id_name]: id1,
            [composite.key2.id_name]: id2,
          },
           transaction: bouncer.transaction
        });

        if (created) {
          logger.warn(`[WARNING] ${functionName}: Composite Key '${composite.theKey}' added to Database '${compositeModel}'.`);
        } else {
          logger.debug(`[DEBUG] ${functionName}: Composite Key '${composite.theKey}' found in Database '${compositeModel}.'`);
        }

        if (localBouncer) {
         await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        }

        Cache.set(composite.theKey, instance);
        logger.debug(`[DEBUG] ${functionName}: Composite Key '${composite.theKey}' added to Cache '${cacheName}'.`);
        cachedComposite = Cache.get(composite.theKey);
        return cachedComposite;
      }
      logger.debug(`[DEBUG] ${functionName}: Composite Key '${composite.theKey}' found in Cache '${cacheName}.'`);
      return cachedComposite;
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
   * Searches for an entry in cache. If no entry, then searches within relevant model.
   *
   * @param {Object} entity The specified entity containing the model and its ID.
   * @param {string} entity.id The ID of the entity.
   * @param {string} entity.fieldName The field name of entity's ID.
   * @param {string} entity.targetModel The model where the entity lives.
   * @param {object} entity.sourceModel The model that the entity references.
   * @param {string} entity.sourceModel.name The name of the model that the entity references.
   * @param {string} entity.sourceModel.alias The alias of the model that the entity references.
   * @param {object} [bouncer={}]  - Optional parameters for the operation
   * - Required if interacting with database.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @param {object} [bouncer.releases] - An object to release lock for specified entity.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `entity`: The updated entry object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local bouncer and an expected or unexpected error occurs,
   * @returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async findEntryWithItems(entity, bouncer={}) {
    const functionName = `${serviceName}.findEntryWithItems`;

    const targetId = entity.id;
    const targetFieldName = entity.fieldName;
    const targetModel = entity.targetModel;
    const sourceModel = entity.sourceModel.name;
    const sourceModelAlias = entity.sourceModel.alias;
    let guests = {};
    let localBouncer = false;

    try {
      logger.debug(`[DEBUG] ${functionName} Store: ${targetModel}`);
      const cacheName = `${targetModel}Cache`;
      const Cache = await this.findOrCreateCacheCollection(cacheName);

      let cachedEntityWithItems = Cache.get(targetId);

      if (!cachedEntityWithItems) {
        logger.debug(`[DEBUG] ${functionName}: User '${targetId}' not found in Cache '${cacheName}'.`);
        if (Object.keys(bouncer).length === 0) {
          guests = {
            [targetModel]: targetId
          }
          bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
          localBouncer = true;
        }

        const theTargetModel = Models[targetModel];
        const theSourceModel = Models[sourceModel];

        const entityWithItems = await theTargetModel.findAll({
          where: {
            [targetFieldName]: targetId
          },
          include: [{ model: theSourceModel, as: sourceModelAlias }],
          transaction: bouncer.transaction
        });

        Cache.set(targetId, { items: [] });

        if (entityWithItems.length === 0) {
          logger.debug(`[DEBUG] ${functionName}: User '${targetId}' not found in Database '${targetModel}'.`);
          logger.debug(`[DEBUG] ${functionName}: User '${targetId}' added to Cache '${cacheName}'.`);
          cachedEntityWithItems = Cache.get(targetId);
        } else {
          logger.debug(`[DEBUG] ${functionName}: User '${targetId}' found in Database '${targetModel}'.`);
          cachedEntityWithItems = Cache.get(targetId);
          entityWithItems.forEach(userItem => {
            cachedEntityWithItems.items.push(userItem);
          });
          Cache.set(targetId, cachedEntityWithItems);
        }
      }

      if (localBouncer) {
        bouncer = await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return cachedEntityWithItems;

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
   * Adds specified item to a user's specified inventory.
   * - Intended for kafe related items.
   *
   * @param {Object} entity The specified entity containing the model and its ID.
   * @param {string} entity.id The ID of the entity.
   * @param {string} entity.targetModel The model where the entity's items live.
   * @param {object} entity.sourceModel An object containing information pertaining to the model that the entity's items reference.
   * @param {string} entity.sourceModel.name The name of the model that the entity's items reference.
   * @param {string} entity.sourceModel.alias The alias of the model that the entity's items reference.
   * @param {object} item - Item object.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * - `userItem`: The updated user's item object after the operation, if successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async addNewItemToEntry(account, item, bouncer={}) {
    const functionName = `${serviceName}.addNewItemToEntry`;

    const targetModel = account.targetModel;
    const sourceModel = account.sourceModel.name;
    const sourceModelAlias = account.sourceModel.alias;
    let guests = {};
    let localBouncer = false;

    try {

      if (Object.entries(bouncer).length === 0) {
        guests = {
          [targetModel]: account.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const theTargetModel = Models[targetModel];
      const theSourceModel = Models[sourceModel];

      function formatFields(account, item) {
        let fields = {};

        if (account.targetModel === 'UserItems') {
          logger.log(`[LOG] ${functionName}: Target Model is 'UserItems'.`);
          fields = {
            user_id: account.id,
            item_id: item.id,
            name: item.name
          }
        } if (account.targetModel === 'UserKafeSupplies') {
          logger.log(`[LOG] ${functionName}: Target Model is 'UserKafeSupplies'.`);
          fields = {
            user_id: account.id,
            item_id: item.id,
            name: item.name,
            type: item.type,
            amount: item.amount,
            max_amount: item.max_amount
          }
        }
        logger.log(`[LOG] ${functionName} Fields:`, fields);
        return fields;
      }

      const fields = formatFields(account, item);

      await theTargetModel.create({
        ...fields
        }, {
          transaction: bouncer.transaction
        });

      const newUserItem = await theTargetModel.findOne({
        where: {
          item_id: item.id,
        },
        include: [{ model: theSourceModel, as: sourceModelAlias }],
        transaction: bouncer.transaction
      });

      logger.log(`[TEST] ${functionName} New User Item:`, newUserItem);

      const cacheName = `${targetModel}Cache`;
      const Cache = await this.findOrCreateCacheCollection(cacheName);
      logger.log(`[TEST] ${functionName} Cache:`, Cache);
      const updatedCachedItems = Cache.get(account.id);
      logger.log(`[TEST] ${functionName} updatedCacheItems (Before):`, updatedCachedItems.items);
      updatedCachedItems.items.push(newUserItem);
      logger.log(`[TEST] ${functionName} updatedCacheItems (After):`, updatedCachedItems.items);
      Cache.set(account.id, updatedCachedItems);
      logger.log(`[TEST] ${functionName} Cached User Items:`, Cache.get(account.id));

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true };
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
   * Refreshes all users energy to their maximum value. Loops through users. If an error occurs, then a warning
   * is logged, and the function continues through the rest of the users.
   *
   * @throws {Error}
   */

  async refreshEnergy() {
    const functionName = `${serviceName}.refreshEnergy`;
    const errors = [];

    const targetModel = 'UserEnergy';
    const Model = Models[targetModel];
    const cacheName = `${targetModel}Cache`;
    const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);
    let bouncer = {};

    logger.log(`[LOG] ${functionName}: Starting operation...`);

    try {
      bouncer = await ErrorServices.startGlobalSquealOperations(functionName, targetModel);

      const users = await Model.findAll({ bouncer: bouncer.transaction });

      for (let user of users) {
        try {
          const updatedUserEnergy = await user.update({ energy: MathServices.addUpToMax(user.energy, 1, user.max_energy) }, { bouncer: bouncer.transaction });
          Cache.set(user.id, updatedUserEnergy);
        } catch (e) {
          errors.push({ userId: user.id, error: e.message });
        }
      }

      if (errors.length > 0) {
        logger.warn(`[WARNING] ${functionName}: Some users failed to refresh energy.`);

        const maxErrorsToLog = 25;
        const errorsToLog = errors.slice(0, maxErrorsToLog);

        errorsToLog.forEach(error => {
          logger.warn(`[WARNING] User ID: ${error.userId}, Error: ${error.error}`);
        });

        if (errors.length > maxErrorsToLog) {
          logger.warn(`[WARNING] ${functionName}: More than 25 users failed to refresh energy...`);
        }
      }
      else {
        logger.log(`[LOG] ${functionName}: All users' energy refreshed.`);
      }
      await ErrorServices.endGlobalSquealOperations(functionName, bouncer);
      logger.log(`[LOG] ${functionName}: User energy refresh completed.`);
    }
    catch (e) {
      ErrorServices.handleError(functionName, e);
      await ErrorServices.handleGlobalDataRollback(functionName, bouncer);
    }
  },

  /**
   * Refreshes user's permission to buy water.
   * - Somewhat important operation.
   *
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   * 
   */

  async refreshWaterRetrievalPower() {
    const functionName = `${serviceName}.refreshWaterRetrievalPower`;

    const errors = [];

    const targetModel = 'UserBalance';
    const Model = Models[targetModel];
    const cacheName = `${targetModel}Cache`;
    const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);
    let bouncer = {};

    logger.log(`[LOG] ${functionName}: Starting operation...`);

    try {
      bouncer = await ErrorServices.startGlobalSquealOperations(functionName, targetModel);

      const users = await Model.findAll({ bouncer: bouncer.transaction });

      for (let user of users) {
        try {
          const updatedUserWaterAllowance = await user.update({ water_allowance: user.water_allowance += 1 }, { bouncer: bouncer.transaction });
          Cache.set(user.id, updatedUserWaterAllowance);
        } catch (e) {
          errors.push({ userId: user.id, error: e.message });
        }
      }

      if (errors.length > 0) {
        logger.warn(`[WARNING] ${functionName}: Some users failed to refresh water allowance.`);

        const maxErrorsToLog = 25;
        const errorsToLog = errors.slice(0, maxErrorsToLog);

        errorsToLog.forEach(error => {
          logger.warn(`[WARNING] User ID: ${error.userId}, Error: ${error.error}`);
        });

        if (errors.length > maxErrorsToLog) {
          logger.warn(`[WARNING] ${functionName}: More than 25 users failed to refresh water allowance...`);
        }
      }
      else {
        logger.log(`[LOG] ${functionName}: All users' water allowance refreshed.`);
      }
      await ErrorServices.endGlobalSquealOperations(functionName, bouncer);
      logger.log(`[LOG] ${functionName}: User water allowance refresh completed.`);
    }
    catch (e) {
      ErrorServices.handleError(functionName, e);
      await ErrorServices.handleGlobalDataRollback(functionName, bouncer);
    }

  },

  /**
   * Refresh stock of supply items.
   * - Critical operation.
   *
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   * 
   */

  async refreshSupplies() {
    const functionName = `${serviceName}.refreshSupplies`;

    const targetModel = 'Supplies';
    const Model = Models[targetModel];
    const cacheName = `${targetModel}Cache`;
    const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);
    let bouncer = {};

    logger.log(`[LOG] ${functionName}: Starting operation...`)

    try {
      bouncer = await ErrorServices.startGlobalSquealOperations(functionName, targetModel);

      await Model.sync({ force: true });
      Cache.clear();
      logger.log(`[LOG] ${functionName}: ${targetModel} store items have been refreshed.`);

      await ErrorServices.endGlobalSquealOperations(functionName, bouncer);

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      await ErrorServices.handleGlobalDataRollback(functionName, bouncer);
      return { success: false, reason: e.message };
    }
  },


}

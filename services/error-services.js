import { logger } from '../logger.js';
import { AppError } from '../errors/error-barrel.js';
import * as Models from '../models/models-barrel.js';
import { client } from '../client.js';
import { CacheServices } from './cache-services.js';
import { ValidationServices } from './validation-services.js';
import { MutexServices } from './mutex-services.js';
import { sequelize } from '../data/db.js';
import { Op, Transaction } from 'sequelize';
import { Mutex } from 'async-mutex';

const serviceName = 'ErrorServices';
export const ErrorServices = {

  /**
   * @typedef {Object.<string, string|number>} Guests An object where the key is a table name
   * and the value is an ID.
   *
   */

  /**
   * @typedef {Transaction} SequelizeTransaction An object containing the transaction for the operation.
   *
   */

  /**
   * @typedef {Mutex} AsyncMutex An object containing the mutex for the involved entity.
   *
   */

  /**
   * @typedef {Object.<string, (string|number)[]>} Mutexes An object containing the mutexes of involved entities.
   *
   */

  /**
   * @typedef {Object.<string, (Function)[]>} Releases An object containing the mutexes of involved entities.
   *
   */

  /**
   * Distinguishes known errors from unexpected errors and logs to console.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {object} e The error.
   *
   */

  handleError(functionName, e) {
    if (e instanceof AppError) {
      logger.error(`[ERROR] ${functionName}: ${e.message}\n${e.stack}`);
    } else {
      logger.error(`[ERROR] ${functionName} Unexpected Error: ${e.message}\n${e.stack}`);
    }
  },

  /**
   * Acquires mutex and associated release function for entire model and creates transaction object.
   * - Intended for critical operations.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {string} model Name of model being locked.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutex, and release function.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutex`: An object containing the global mutex.
   * - `release`: An object containing the involved release function.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async startGlobalSquealOperations(functionName, model) {
    const errorFunctionName = `${serviceName}.startGlobalSquealOperations`;

    const mutexName = `${model}Mutexes`
    let globalMutex;
    let globalRelease;

    try {
      const Mutexes = MutexServices.findOrCreateMutexMap(mutexName);
      logger.debug(`[DEBUG] ${functionName} mutexName:`, mutexName);
      logger.debug(`[DEBUG] ${functionName} Mutexes:`, Array.from(Mutexes));

      // create promise to wait for all mutexes currently locked to be released
      const promiseUnlock = Array.from(Mutexes).map(async ([index, mutex]) => {
          logger.debug(`[DEBUG] ${functionName} ${index}`);
        if (mutex.isLocked()) {
          logger.debug(`[DEBUG] ${functionName} Mutex ID ${index} is locked:`, mutex.isLocked());
          try {
            // already resolves to a promise
            await mutex.waitForUnlock();
          } catch (e) {
            ErrorServices.handleError(functionName, e);
          }
        }
        return Promise.resolve();
      });

      await Promise.all(promiseUnlock);
      logger.debug(`[DEBUG] ${functionName} No mutex is locked.`);
      globalMutex = MutexServices.getOrSetMutex('global', mutexName);
      globalRelease = await globalMutex.acquire();
      logger.debug(`[DEBUG] ${functionName} Global Mutex for '${model}' acquired:`, globalMutex.isLocked());

      const transaction = await sequelize.transaction();
      logger.debug(`[DEBUG] ${functionName} Operations started...`);

      return { success: true, model, globalMutex, globalRelease, transaction };
    } catch (e) {
      this.handleError(errorFunctionName, e);
      throw e;
    }
  },

  /**
   * Commits transaction and releases mutex for entire model.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {{model: string, transaction: SequelizeTransaction, mutex: AsyncMutex, release: Function}} bouncer An object containing the model name, transaction, mutex and release function for model.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutex, and release function.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutex`: An object containing the involved mutex.
   * - `release`: An object containing the involved release function.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async endGlobalSquealOperations(functionName, bouncer) {
    const errorFunctionName = `${serviceName}.endGlobalSquealOperations`;

    try {
      bouncer.transaction.commit();
      logger.debug(`[DEBUG] ${functionName}: Operations saved to database.`);

      bouncer.globalRelease();
      logger.debug(`[DEBUG] ${functionName} Global Mutex for ${bouncer.model} is released:`, bouncer.globalMutex.isLocked());
    } catch (e) {
      this.handleError(errorFunctionName, e);
    }
  },

  /**
   * Rolls back any database operations and resets cached references to before the operation started
   * in the event an error occurs.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {{model: string, transaction: SequelizeTransaction, mutex: AsyncMutex, release: Function}} bouncer An object containing the model name, transaction, mutex and release function for model.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutex, and release function.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutex`: An object containing the involved mutex.
   * - `release`: An object containing the involved release function.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async handleGlobalDataRollback(functionName, bouncer) {
    const errorFunctionName = `${functionName}.handleGlobalSquealOperations`;

    const cacheName = `${bouncer.model}Cache`;
    const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);

    try {
      logger.error(`[ERROR] ${errorFunctionName} ${functionName} transaction not finished:`, !bouncer.transaction.finished)
      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Transactions rolling back...`);
      await bouncer.transaction.rollback();
      logger.error(`[ERROR] ${errorFunctionName} ${functionName} transaction not finished:`, !bouncer.transaction.finished)
      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Transactions successfully rolled back.`);

      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Cache resetting...`);
      Cache.clear();
      logger.error(`[ERROR] ${errorFunctionName} ${functionName} Cache for ${bouncer.model} is cleared.`);
    } catch (e) {
      this.handleError(errorFunctionName, e);
    }
  },

  /**
   * Acquires mutexes and associated release function for involved entities and creates transaction object.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {Guests} guests An object containing the table and ids of involved entities as
   * keys and values, respectively.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutexes, and release functions.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutexes`: An object containing the involved mutexes.
   * - `releases`: An object containing the involved release functions.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async startAdvancedSquealOperations(functionName, guests) {
    const errorFunctionName = `${serviceName}.startAdvanceSquealOperations`;

    let mutexes = {};
    let releases = {};

    const acquireMutexes = async (ids, mutexMap) => {
      if (!mutexes.hasOwnProperty(mutexMap)) {
        const globalMutex = MutexServices.getOrSetMutex('global', mutexMap);
        logger.debug(`[DEBUG] ${functionName} globalMutex is locked:`, globalMutex.isLocked());
        if((globalMutex.isLocked())) {
          // already resolves to a promise
          await globalMutex.waitForUnlock()
        }
        mutexes[mutexMap] = [];
        releases[mutexMap] = [];
      }
      let currentMutexMap = mutexes[mutexMap];
      logger.debug(`[DEBUG] ${functionName} mutexMap:`, mutexMap);
      let currentReleases = releases[mutexMap];
      await Promise.all(
        ids.map(async (id, index) => {
          logger.debug(`[DEBUG] ${functionName} Index:`, index);
          logger.debug(`[DEBUG] ${functionName} id:`, id);
          logger.debug(`[DEBUG] ${functionName} mutexMap:`, mutexMap);
          currentMutexMap.push(MutexServices.getOrSetMutex(id, mutexMap));
          if (currentMutexMap[index].isLocked()) {
            throw new Error(`Mutex for '${id}' is locked.`);
          }
          let release = await currentMutexMap[index].acquire();
          currentReleases.push(release);
          logger.debug(`[DEBUG] ${functionName} Mutex '${index}' acquired:`, currentMutexMap[index].isLocked());
        })
      );
    };

    try {
      for (let [models, ids] of Object.entries(guests)) {
        logger.debug(`[DEBUG] ${functionName} main model:`, models);
        const mutexMap = `${models}Mutexes`;
        if (Array.isArray(ids)) {
          await acquireMutexes(ids, mutexMap);
        } else {
          await acquireMutexes([ids], mutexMap);
        }
      }

      let transaction = await sequelize.transaction();
      logger.debug(`[DEBUG] ${functionName} Operations started...`);

      return { success: true, mutexes, releases, transaction };

    } catch (e) {
      this.handleError(errorFunctionName, e);
      throw e;
    }
  },

  /**
   * Releases mutexes involved in operation.
   * - Helper function for this.handleAdvancedMutexRelease
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {Object.<string, Mutexes>} mutexes An object containing the mutexes of involved entities.
   * @param {Object.<string, Releases>} releases An object containing the release functions of involved entities.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async handleAdvancedMutexRelease(functionName, mutexes, releases) {
    const errorFunctionName = `${serviceName}.handleAdvancedMutexRelease`;
    try {
      for (let [mutexMaps, releaseArr] of Object.entries(releases)) {
        await Promise.all(
          releaseArr.map(async (release, index) => {
            await release();
            logger.debug(`[DEBUG] ${functionName}: Mutex of ${mutexMaps} at index '${index}' released:`, !(mutexes[mutexMaps][index].isLocked()));
          })
        );
      }
    } catch (e) {
      this.handleError(errorFunctionName, e);
    }
  },

  /**
   * Releases mutexes for involved entities and commits transaction.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {{transaction: SequelizeTransaction, mutexes: Mutexes, releases: Releases}} bouncer An object containing the tables and ids of involved entities.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutexes, and release functions.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutexes`: An object containing the involved mutexes.
   * - `releases`: An object containing the involved release functions.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async endAdvancedSquealOperations(functionName, bouncer) {
    const errorFunctionName = `${serviceName}.endAdvancedSquealOperations`;
    try {
      const { transaction, mutexes, releases } = bouncer;
      await transaction.commit();
      logger.debug(`[DEBUG] ${functionName}: Operations saved to database.`);

      await this.handleAdvancedMutexRelease(functionName, mutexes, releases);

      return { success: true, transaction, mutexes, releases };

    } catch (e) {
      this.handleError(errorFunctionName, e);
      throw e;
    }
  },

  /**
   * Rolls back any database operations and resets cached references to before the operation started
   * in the event an error occurs.
   *
   * @param {string} functionName The name of the function it is being used in.
   * @param {{transaction: SequelizeTransaction, mutexes: Mutexes, releases: Releases}} bouncer An object
   * containing the tables and ids of involved entities.
   * @param {Guests} guests An object containing the table and ids of involved entities as
   * keys and values, respectively.
   * @returns {Promise<object|null>} A promise that resolves to the transaction, mutexes, and release functions.
   * - `success`: A boolean indicating whether the operation was successful.
   * - `transaction`: An object containing the transaction.
   * - `mutexes`: An object containing the involved mutexes.
   * - `releases`: An object containing the involved release functions.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   *
   */

  async handleAdvancedDataRollback(functionName, guests, bouncer) {
    const errorFunctionName = `${serviceName}.handleAdvancedUserRollBack`;

    try {
      logger.error(`[ERROR] ${errorFunctionName} ${functionName} transaction not finished:`, !bouncer.transaction.finished)
      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Transactions rolling back...`);
      await bouncer.transaction.rollback();
      logger.error(`[ERROR] ${errorFunctionName} ${functionName} transaction not finished:`, !bouncer.transaction.finished)
      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Transactions successfully rolled back.`);

      logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Cache resetting...`);

      const userItemsDatabase = ['UserItemsCache', 'UserKafeItemsCache', 'UserKafeSuppliesCache'];

      async function resetCacheForId(ids, model, isUserItemsDatabase, Cache) {
        await Promise.all(
          ids.map(async (id) => {
            logger.error(`[TEST] ${errorFunctionName} ${functionName}: resetCacheForId function operating...`);
            const whereCondition = {
              [Op.or]: { id: id }
            };

            const cacheData = isUserItemsDatabase
              ? await Models[model].findAll({ where: whereCondition })
              : await Models[model].findOne({ where: whereCondition });

            if (cacheData) {
              Cache.set(id, isUserItemsDatabase ? { items: cacheData } : cacheData );
              logger.error(`[ERROR] ${errorFunctionName} ${functionName}: Cache for '${id}' successfully reset.`);
            }
            logger.error(`[ERROR] ${errorFunctionName} ${functionName} ${model} transaction not finished:`, !bouncer.transaction.finished)
          })
        );
      }


      for (let [model, ids] of Object.entries(guests)) {
        logger.error(`[ERROR] ${errorFunctionName} ${functionName}: guests:`, guests);
        const cacheName = `${model}Cache`;
        const isUserItemsDatabase = userItemsDatabase.includes(cacheName);
        const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);

        if (Array.isArray(ids)) {
          await resetCacheForId(ids, model, isUserItemsDatabase, Cache);
        } else {
          await resetCacheForId([ids], model, isUserItemsDatabase, Cache);
        }
      }

      await this.handleAdvancedMutexRelease(functionName, bouncer.mutexes, bouncer.releases);

      logger.error(`[ERROR] ${functionName} !opts.transaction.finished:`, !bouncer.transaction.finished);

    } catch (e) {
      logger.error(`[ERROR] ${functionName}:`, e.stack);
      this.handleError(errorFunctionName, e);
    }
  },

  // ---------------------------------------------------------

  /**
   * @deprecated
   *
   */

  async startSquealOperations(functionName, depository, ids) {
    const errorFunctionName = `${serviceName}.startSquealOperations`;
    logger.debug(`[DEBUG] ${functionName} userIds.isArray:`, Array.isArray(ids));
    logger.debug(`[DEBUG] ${functionName} userIds:`, ids);

    let mutexNames = [];
    let mutexes = {};
    let releases = {};

    try {
      if (Array.isArray(depository)) {
        for (let i = 0; i < depository.length; i++) {
          mutexNames.push(`${depository[i]}Mutexes`);
        }
      } else {
        mutexNames.push(`${depository}Mutexes`);
      }

      const acquireMutexes = async (ids, mutexes, currentMutexMap) => {
        await Promise.all(
          ids.map(async (id, index) => {
            logger.debug(`[DEBUG] ${functionName} Index:`, index);
            mutexes[index] = MutexServices.getOrSetMutex(id, currentMutexMap);
            let release = await mutexes[index].acquire();
            releases[index] = release;
            logger.debug(`[DEBUG] ${functionName} Mutex '${index}' acquired:`, mutexes[index].isLocked());
          })
        );
      };

      for (let j = 0; j < mutexNames.length; j++) {
        const currentMutexMap = mutexNames[j];
        if (Array.isArray(ids)) {
            await acquireMutexes(ids, mutexes, currentMutexMap);
        } else {
          await acquireMutexes([ids], mutexes, currentMutexMap);
        }
      }
      let transaction = await sequelize.transaction();
      logger.debug(`[DEBUG] ${functionName} Operations started...`);

      return { success: true, mutexes, releases, transaction };

    } catch (e) {
      this.handleError(errorFunctionName, e);
      throw e;
    }
  },

  /**
   * @deprecated
   *
   */

  async handleMutexRelease(functionName, mutexes, releases) {
    const errorFunctionName = `${serviceName}.handleMutexRelease`;
    try {
      await Promise.all(
        Object.entries(releases).map(async ([key, release]) => {
          logger.debug(`[DEBUG] ${functionName} index:`, key);
          release();
          logger.debug(`[DEBUG] ${functionName} Mutex '${key}' acquired:`, mutexes[key].isLocked());
        })
      );
    } catch (e) {
      this.handleError(errorFunctionName, e);
    }
  },

  /**
   * @deprecated
   *
   */

  async endSquealOperations(functionName, opts) {
    const errorFunctionName = `${serviceName}.endSquealOperations`;
    try {
      const { transaction, mutexes, releases } = opts;
      await transaction.commit();
      logger.debug(`[DEBUG] ${functionName}: Operations saved to database.`);

      await this.handleMutexRelease(functionName, mutexes, releases);

      return { success: true, transaction, mutexes, releases };

    } catch (e) {
      this.handleError(errorFunctionName, e);
      throw e;
    }
  },

  /**
   * @deprecated
   *
   */

  async handleDataRollback(functionName, depository, ids, opts) {
    const errorFunctionName = `${serviceName}.handleUserRollBack`;

    try {
      logger.error(`[ERROR] ${functionName}: Transactions rolling back...`);
      await opts.transaction.rollback();
      logger.error(`[ERROR] ${functionName}: Transactions successfully rolled back.`);

      logger.error(`[ERROR] ${functionName}: Cache resetting...`);

      const itemsDatabase = ['UserItemsCache', 'UserKafeItemsCache', 'UserKafeSuppliesCache'];

      let depositories = Array.isArray(depository) ? depository : [depository];
      logger.error(`[ERROR] ${functionName}: depositories:`, depositories);

      async function resetCacheForId(id, currentDepository, isItemsDatabase, Cache) {
        logger.error(`[ERROR] ${functionName} currentDepository:`, currentDepository);
        logger.error(`[ERROR] ${functionName} database.currentDepository:`, Models.currentDepository);
        const whereCondition = {
          [Op.or]: [
            { user_id: id },
            { composite_key: id }
          ]
        };

        const cacheData = isItemsDatabase
          ? await Models[currentDepository].findAll({ where: whereCondition })
          : await Models[currentDepository].findOne({ where: whereCondition });

        if (cacheData) {
          Cache.set(id, isItemsDatabase ? { items: cacheData } : cacheData );
          logger.error(`[ERROR] ${functionName}: Cache for '${id}' successfully reset.`);
        }
      }

      for (let i = 0; i < depositories.length; i++) {
        const currentDepository = depositories[i];
        logger.error(`[ERROR] ${functionName} currentDepository:`, currentDepository);
        const cacheName = `${currentDepository}Cache`;
        const isItemsDatabase = itemsDatabase.includes(cacheName);
        const Cache = await CacheServices.findOrCreateCacheCollection(cacheName);


        if (Array.isArray(ids)) {
          for (let j = 0; j < ids.length; j++) {
            if (!Cache.has(ids[j])) {
              continue;
            }
            logger.error(`[ERROR] ${functionName} isArray: true`);
            await resetCacheForId(ids[j], currentDepository, isItemsDatabase, Cache);
          }
        } else {
          if (!Cache.has(ids)) {
            continue;
          }
          logger.error(`[ERROR] ${functionName} isArray: false`);
          logger.error(`[ERROR] ${functionName} currentDepository:`, currentDepository);
          await resetCacheForId([ids], currentDepository, isItemsDatabase, Cache);
        }
      }

      await this.handleMutexRelease(functionName, opts.mutexes, opts.releases);

    } catch (e) {
      this.handleError(errorFunctionName, e);
    }
  },

}

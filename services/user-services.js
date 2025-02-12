import { logger } from '../logger.js';
import { MathServices } from './math-services.js';
import { CacheServices } from './cache-services.js';
import { ValidationServices } from './validation-services.js';
import { ErrorServices } from './error-services.js';
import { InsufficientResourcesError } from '../errors/error-barrel.js';

const serviceName = 'UserServices';

export const UserServices = {

  /**
   * Retrieves user ID reference stored in cache.
   *
   * @param {string} userId ID of specified user.
   * @returns {Promise<{ id: string }|null>} A promise that resolves to the user ID reference stored in cache.
   * @throws {Error} If expected or unexpected error occurs, yeet.
   */

  async getUser(userId, bouncer={}) {
    const functionName = `${serviceName}.getUser`;
    let user;
    let model = 'Users'
    let guests = {};
    let localBouncer = false;
    try {
      const Cache = await CacheServices.findOrCreateCacheCollection('UsersCache');
      logger.debug(`[DEBUG] Cache:`, Cache);
      user = Cache.get(userId);
      if (!user) {
        if(Object.keys(bouncer).length === 0) {
          guests = {
            [model]: userId
          };
          bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
          localBouncer = true;
        }
        user = await CacheServices.getOrSetCacheEntry({
          targetModel: model,
          id: userId
        }, bouncer);
        if (localBouncer) {
          await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        }
      }
      return user;
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
   * Retrieves user energy reference stored in cache.
   *
   * @param {string} userId ID of specified user.
   * @returns {Promise<{user: { id: string, energy: number, max_energy: number, min_energy: number, model: string } | null, table: string, success?: boolean, reason?: string }>} A promise resolving to user energy details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async getEnergy(userId, bouncer={}) {
    const functionName = `${serviceName}.getUserEnergy`;

    const targetModel = 'UserEnergy'
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userEntity = {
        targetModel,
        id: userId
      }

      let userEnergy = await CacheServices.getOrSetCacheEntry(userEntity, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return userEnergy;

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
   * Adds specified amount to a user's energy. Does not exceed user's max energy.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of energy to add.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{userEnergy: { id: string, energy: number, max_energy: number, min_energy: number, table: string } | null, table: string, success?: boolean, reason?: string }>} A promise resolving to the updated user energy details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async addEnergy(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.addEnergy`;

    const targetModel = 'UserEnergy';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.validateInputs({ userId });
      ValidationServices.ValidateTransactionObject(bouncer.transaction);


      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let cachedUser = await this.getEnergy(userId, bouncer);

      if (cachedUser.energy === cachedUser.max_energy) {
        logger.info(`[INFO] ${functionName}: User '${userId}' is already at max (${cachedUser.energy}) energy.`);
        return { success: false, reason: 'MAX_ENERGY', userEnergy: cachedUser };
      }

      cachedUser.energy = MathServices.addUpToMax(cachedUser.energy, amount, cachedUser.max_energy);

      await cachedUser.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userEnergy: cachedUser };

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
   * Removes specified amount to a user's energy. Does not exceed user's max energy.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of energy to remove.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{userEnergy: { id: string, energy: number, max_energy: number, min_energy: number, table: string } | null, table: string, success?: boolean, reason?: string }>} A promise resolving to the updated user energy details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async removeEnergy(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.removeEnergy`;

    const targetModel = 'UserEnergy';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.validateInputs({ userId });
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let cachedUser = await this.getEnergy(userId, bouncer);

      if (cachedUser.energy === cachedUser.min_energy) {
        logger.info(`[INFO] ${functionName}: User '${userId}' is already at minimum (${cachedUser.energy}) energy.`);
        return { success: false, reason: 'MIN_ENERGY', userEnergy: cachedUser };
      }

      cachedUser.energy = MathServices.removeDownToMin(cachedUser.energy, amount, cachedUser.min_energy);

      await cachedUser.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userEnergy: cachedUser };

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
   * Retrieves user level reference stored in cache.
   *
   * @param {string} userId - ID of specified user.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userLevel: { id: string, level: number, total_exp: number, prev_exp_req: number, current_level_exp: number, current_exp_req: number }, success?: boolean, reason?: string}>} A promise resolves to the user's level details or an error object containg the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async getLevel(userId, bouncer={}) {
    const functionName = `${serviceName}.getUserLevel`;

    const targetModel = 'UserLevel'
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer) === 0) {
        guests = {
          [targetModel]: userId
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userEntity = {
        targetModel,
        id: userId
      }

      let userLevel = await CacheServices.getOrSetCacheEntry(userEntity, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return userLevel;

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
   * Increases level by 1 and sets new exp required for next level.
   *
   * @param {object} userLevel - User level reference.
   * @param {string} userLevel.id - ID of specified user.
   * @param {number} userLevel.level - The user's current level.
   * @param {number} userLevel.total_exp - The user's total accrued experience.
   * @param {number} userLevel.prev_exp_req - The experience required for the previous level.
   * @param {number} userLevel.current_level_exp - The user's experience in the current level.
   * @param {number} userLevel.current_exp_req - The experience required for the current level.
   * @param {number} userLevel.current_exp_req - Amount of exp required to reach next level.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{userLevel: userLevel, success?: boolean, reason?: string}>} A promise that resolves to the user's updated level details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async levelUp(userLevel, bouncer={}) {
    const functionName = `${serviceName}.levelUp`;

    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          'UserLevel': userLevel.id
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      userLevel.level += 1;
      userLevel.prev_exp_req = userLevel.current_exp_req;
      userLevel.current_level_exp = userLevel.current_level_exp - userLevel.current_exp_req;
      userLevel.current_exp_req = await MathServices.calculateExpReq(userLevel.level, userLevel.prev_exp_req);

      await userLevel.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userLevel };

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
   * Adds specified amount to target user's experience.
   * If current exp reaches required amount, then levels up user.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of exp to add.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userLevel: { id: string, level: number, total_exp: number, prev_exp_req: number, current_level_exp: number, current_exp_req: number }, levelUp?: boolean, success?: boolean, reason?: string}>} - A promise resolves to the user's level details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async addExp(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.addExp`;

    const targetModel = 'UserLevel';
    let levelUpStatus = false;
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let cachedUser = await this.getLevel(userId, bouncer);

      cachedUser.current_level_exp += Number(amount);
      cachedUser.total_exp += Number(amount);
      logger.log(`[LOG] ${functionName}: Added ${amount} exp to User '${userId}'.`);

      await cachedUser.save({ transaction: bouncer.transaction });

      levelUpStatus = (cachedUser.current_level_exp >= cachedUser.current_exp_req) || false;

      if (levelUpStatus) {
        logger.log(`[LOG] ${functionName}: LevelUp:`, levelUpStatus);
        const { success } = await this.levelUp(cachedUser, bouncer);
        logger.log(`[LOG] ${functionName}: LevelUp successful:`, success);
      } else {
        logger.log(`[LOG] ${functionName} LevelUp:`, levelUpStatus);
      }

      await cachedUser.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        userLevel: cachedUser,
        levelUp: levelUpStatus
      }

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
   * Subtracts specified amount from target user's experience.
   * [WARNING] Need to address when amount reaches 0.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of exp to subtract.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userLevel: { id: string, level: number, total_exp: number, prev_exp_req: number, current_level_exp: number, current_exp_req: number }, levelUp?: boolean, success?: boolean, reason?: string}>} - A promise resolves to the user's level details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async subtractExp(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.subtractExp`;

    const targetModel = 'UserLevel';
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let cachedUser = await this.getLevel(userId, bouncer);

      const prev_level_exp = cachedUser.current_level_exp;
      cachedUser.current_level_exp -= MathServices.removeDownToMin(cachedUser.current_level_exp, amount, 0);

      await cachedUser.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        userLevel: cachedUser,
        prev_level_exp,
      }

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
   * Retrieves user's balance reference stored in cache.
   *
   * @param {string} userId ID of specified user.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userBalance: { id: string, balance: number, max_debt: number }, success?: boolean, reason?: string }|null>} A promise resolves to the user's balance details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async getBalance(userId, bouncer={}) {
    const functionName = `${serviceName}.getBalance`;

    const targetModel = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userEntity = {
        id: userId,
        targetModel
      }

      let userBalance = await CacheServices.getOrSetCacheEntry(userEntity, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return userBalance;

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
   * Add specified amount to target user's balance.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of funds to add.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userBalance: { id: string, balance: number, max_debt: number }, success?: boolean, reason?: string }|null>} A promise resolves to the updated user's balance details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async addBalance(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.addBalance`;

    const targetModel = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      logger.log(`[LOG] ${functionName}: Beginning operation...`);
      let cachedUser = await this.getBalance(userId, bouncer);

      const prev_balance = cachedUser.balance;
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' has ${MathServices.displayCurrency(cachedUser.balance).amount} ${MathServices.displayCurrency(cachedUser.balance).units}.`);
      cachedUser.balance += Number(amount);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' received ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      cachedUser.balance = MathServices.roundTo2Decimals(cachedUser.balance);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' now has ${MathServices.displayCurrency(cachedUser.balance).amount} ${MathServices.displayCurrency(cachedUser.balance).units}.`);
      await cachedUser.save({ transaction: bouncer.transaction });

      logger.log(`[LOG] ${functionName}: Operation completed.`);
      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userBalance: cachedUser, prev_balance };

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
   * Subtracts specified amount from user's balance.
   * - Does not allow user's balance to go below user's max debt limit.
   * - If the difference between user's balance and the specified amount is less than user's max debt limit,
   *   then throws error.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of funds to subtract.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userBalance: { id: string, balance: number, max_debt: number }, success?: boolean, reason?: string }|null>} A promise resolves to the updated user's balance details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async subtractBalance(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.subtractBalance`;

    const targetModel = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      logger.log(`[LOG] ${functionName}: Beginning operation...`);
      let cachedUser = await this.getBalance(userId, bouncer);

      if ((cachedUser.balance - amount) < cachedUser.max_debt) {
        logger.error(`[ERROR] ${userId} too poor.`);
        throw new InsufficientResourcesError(`User '${userId}'`, 'funds', 'funds');
      }

      const prev_balance = cachedUser.balance;
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' has ${MathServices.displayCurrency(cachedUser.balance).amount} ${MathServices.displayCurrency(cachedUser.balance).units}.`);
      cachedUser.balance -= Number(amount);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' lost ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      cachedUser.balance = MathServices.roundTo2Decimals(cachedUser.balance);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' now has ${MathServices.displayCurrency(cachedUser.balance).amount} ${MathServices.displayCurrency(cachedUser.balance).units}.`);
      await cachedUser.save({ transaction: bouncer.transaction });

      logger.log(`[LOG] ${functionName}: Operation completed.`);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userBalance: cachedUser, prev_balance };

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
   * Transfers specified amount from user1's balance to user2's balance.
   * - Does not allow user1's balance to go below user's max debt limit.
   * - If the difference between user1's balance and the specified amount is less than user1's max debt limit,
   *   then throws error.
   *
   * @param {string} userId1 - ID of first specified user.
   * @param {string} userId2 - ID of second specified user.
   * @param {number} amount - Amount of funds to transfer.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `user1`: The updated user object after the operation, if successful.
   * - `user2`: The updated user object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs,
   * returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async transferFunds(userId1, userId2, amount, bouncer={}) {
    const functionName = `${serviceName}.transferFunds`;

    logger.log(`[LOG] ${functionName}: Beginning transfer...`);

    const targetModel = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.validateInputs({ userId1, userId2 });


      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: [userId1, userId2]
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
        logger.log(`[LOG] ${functionName}: Guests ID'd. Bouncer escorting...`);
      }

      logger.log(`[LOG] ${functionName}: Processing sender balance transfer...`);
      let sender = await this.subtractBalance(userId1, amount, bouncer);
      logger.log(`[LOG] ${functionName}: Processing recipient balance transfer...`);
      let recipient = await this.addBalance(userId2, amount, bouncer);

      logger.log(`[LOG] ${functionName}: Transfer completed.`);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
        logger.log(`[LOG] ${functionName}: Guests escorted out. Bouncer on standby.`);
      }

      return { success: true, sender: sender.userBalance , recipient: recipient.userBalance };

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, e };
      }
      throw e;
    }
  },

  /**
   * Subtracts specified amount from user's water allowance.
   * - Does not allow user's water allowance to go below 0.
   *
   * @param {string} userId - ID of specified user.
   * @param {number} amount - Amount of allowances to subtract.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{ userBalance: { id: string, water_allowance: number, }, success?: boolean, reason?: string }|null>} A promise resolves to the updated user's water allowance details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async subtractWaterAllowance(userId, amount, bouncer={}) {
    const functionName = `${serviceName}.subtractWaterAllowance`;

    const targetModel = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      logger.log(`[LOG] ${functionName}: Beginning operation...`);
      let cachedUser = await this.getBalance(userId, bouncer);

      if ((cachedUser.water_allowance - amount) < 0) {
        logger.error(`[ERROR] ${userId} would be using more than allowance.`);
        throw new InsufficientResourcesError(`User '${userId}'`, 'allowance', 'allowance');
      }

      const prev_allowance = cachedUser.water_allowance;
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' has ${cachedUser.water_allowance}.`);
      cachedUser.water_allowance -= Number(amount);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' lost ${Number(amount)}.`);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' now has ${cachedUser.water_allowance}.`);
      await cachedUser.save({ transaction: bouncer.transaction });

      logger.log(`[LOG] ${functionName}: Operation completed.`);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, water_allowance: cachedUser.water_allowance, prev_allowance };

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },
}

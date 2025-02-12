import { logger } from '../logger.js';
import { CacheServices } from './cache-services.js';
import { MathServices } from './math-services.js';
import { ValidationServices } from './validation-services.js';
import { ErrorServices } from './error-services.js';
import { InsufficientResourcesError } from '../errors/error-barrel.js';

const serviceName = 'UserKafeServices';

export const UserKafeServices = {

  /**
   * Retrieves user ID reference stored in cache.
   *
   * @param {string} userId ID of specified user.
   * @returns {Promise<{ id: string }|null>} A promise that resolves to the user ID reference stored in cache.
   * @throws {Error} If expected or unexpected error occurs, yeet.
   */

  async get(userId, bouncer={}) {
    const functionName = `${serviceName}.get`;
    let user;
    let model = 'UserKafe'
    let guests = {};
    let localBouncer = false;
    try {
      const Cache = await CacheServices.findOrCreateCacheCollection('UserKafeCache');
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

    const model = 'UserLevel'
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer) === 0) {
        guests = {
          [model]: userId
        }
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userEntity = {
        model: model,
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
   * @param {number} expRequired - Amount of exp required to reach next level.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified user.
   * @param {object} [bouncer.releases] - An object to release lock for specified user.
   * @returns {Promise<{userLevel: userLevel, success?: boolean, reason?: string}>} A promise that resolves to the user's updated level details or an error object containing the reason.
   * - `success`: A booloean indicating whether or not the operation was successful.
   * @throws {Error} If an expected or unexpected error occurs, returns `success: false` and `reason: e.message`.
   */

  async levelUp(userLevel, expRequired, bouncer={}) {
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
      userLevel.prev_exp_req = expRequired;
      userLevel.current_level_exp = userLevel.current_level_exp - expRequired;
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

    const cachedUser = await this.getLevel(userId);
    const model = cachedUser.userLevel.constructor.name;
    let user = cachedUser.userLevel;
    let levelUpStatus = false;
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const prev_level_exp = user.current_level_exp;
      user.current_level_exp += Number(amount);

      if (user.current_level_exp >= user.current_exp_req) {
        let levelUp = await this.levelUp(user, user.current_exp_req, bouncer);
        levelUpStatus = levelUp.success;
      }

      await user.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        userLevel: user,
        prev_level_exp,
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

    const cachedUser = await this.getLevel(userId);
    const model = cachedUser.userLevel.constructor.name;
    let user = cachedUser.userLevel;
    let guests = {};
    let localBouncer = false;

    try {
      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const prev_level_exp = user.current_level_exp;
      user.current_level_exp -= MathServices.removeDownToMin(user.current_level_exp, amount, 0);

      await user.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        userLevel: user,
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

    const model = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const userEntity = {
        model: model,
        id: userId
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

    const cachedUser = await this.getBalance(userId);
    const model = cachedUser.constructor.name;
    let user = cachedUser;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const prev_balance = user.balance;
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' has ${MathServices.displayCurrency(user.balance).amount} ${MathServices.displayCurrency(user.balance).units}.`);
      user.balance += Number(amount);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' received ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      user.balance = MathServices.roundTo2Decimals(user.balance);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' now has ${MathServices.displayCurrency(user.balance).amount} ${MathServices.displayCurrency(user.balance).units}.`);
      await user.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userBalance: user, prev_balance };

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

    const cachedUser = await this.getBalance(userId);
    const model = cachedUser.userBalance.constructor.name;
    let user = cachedUser.userBalance;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: userId
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      if ((user.balance - amount) < user.max_debt) {
        throw new InsufficientResourcesError(`User '${userId}'`, 'funds', 'funds');
      }

      const prev_balance = user.balance;
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' has ${MathServices.displayCurrency(user.balance).amount} ${MathServices.displayCurrency(user.balance).units}.`);
      user.balance -= Number(amount);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' lost ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      user.balance = MathServices.roundTo2Decimals(user.balance);
      logger.debug(`[DEBUG] ${functionName}: User '${userId}' now has ${MathServices.displayCurrency(user.balance).amount} ${MathServices.displayCurrency(user.balance).units}.`);
      await user.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, userBalance: user, prev_balance };

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        logger.error(`[ERROR] ${userId} too poor.`);
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

    await this.getBalance(userId1);
    await this.getBalance(userId2);
    const model = 'UserBalance';
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.validateInputs({ userId1, userId2 });


      if (Object.keys(bouncer).length === 0) {
        guests = {
          [model]: [userId1, userId2]
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      let sender = await this.subtractBalance(userId1, amount, bouncer);
      let recipient = await this.addBalance(userId2, amount, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, sender, recipient };

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  },

}

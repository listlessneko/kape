import { logger } from '../logger.js';
import { MathServices } from './math-services.js';
import { CacheServices } from './cache-services.js';
import { ValidationServices } from './validation-services.js';
import { ErrorServices } from './error-services.js';
import { InsufficientResourcesError } from '../errors/error-barrel.js';

const serviceName = 'BalanceServices';
export const BalanceServices = {
  /**
   * @typedef {Object} Account
   * @property {string} targetModel The model of the recipient's account.
   * @property {string} id The id of the recipient's account.
   */

  /**
   * @typedef {Object} transactingAccounts
   * @property {Account} sender The sender's id and model.
   * @property {Account} recipient The recipient's id and model.
   */

  /**
   * @typedef {Object} Bouncer - Optional parameters for the operation.
   * @property {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @property {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @property {object} [bouncer.releases] - An object to release lock for specified entity.
   */

  /**
   * Add specified amount to target account.
   *
   * @param {Account} account The id and model of specified entity.
   * @param {number} amount Amount of funds to add.
   * @param {Bouncer} bouncer Optional parameters for the operation.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `account`: The updated account object after the operation, if successful.
   * - `prev_balance`: An object indicating the previous amount of funds.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs,
   * returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async add(account, amount, bouncer={}) {
    const functionName = `${serviceName}.add`;

    const targetModel = account.targetModel;
    const id = account.id;
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);


      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      account = await CacheServices.getOrSetCacheEntry(account, bouncer);

      const prev_balance = account.balance;
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' has ${MathServices.displayCurrency(account.balance).amount} ${MathServices.displayCurrency(account.balance).units}.`);
      account.balance += Number(amount);
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' received ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      account.balance = MathServices.roundTo2Decimals(account.balance);
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' now has ${MathServices.displayCurrency(account.balance).amount} ${MathServices.displayCurrency(account.balance).units}.`);
      await account.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, account, prev_balance };

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
   * Removes specified amount from target account.
   *
   * @param {Account} account - The id and model of specified entity.
   * @param {number} amount - Amount of funds to remove.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @param {object} [bouncer.releases] - An object to release lock for specified entity.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `entity`: The updated entity object after the operation, if successful.
   * - `prev_balance`: An object indicating the previous amount of funds.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs,
   * returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async deduct(account, amount, bouncer={}) {
    const functionName = `${serviceName}.deduct`;

    const targetModel = account.targetModel;
    const id = account.id;
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);
      ValidationServices.ValidateTransactionObject(bouncer.transaction);


      if (Object.keys(bouncer).length === 0) {
        guests = {
          [targetModel]: id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      account = await CacheServices.getOrSetCacheEntry(account, bouncer);

      if ((account.balance - amount) < account.max_debt) {
        throw new InsufficientResourcesError(`${targetModel} Account ${id}`, 'funds', 'funds');
      }

      const prev_balance = account.balance;
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' has ${MathServices.displayCurrency(account.balance).amount} ${MathServices.displayCurrency(account.balance).units}.`);
      account.balance -= Number(amount);
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' lost ${MathServices.displayCurrency(amount).amount} ${MathServices.displayCurrency(amount).units}.`);
      account.balance = MathServices.roundTo2Decimals(account.balance);
      logger.debug(`[DEBUG] ${functionName}: ${targetModel} Account '${id}' now has ${MathServices.displayCurrency(account.balance).amount} ${MathServices.displayCurrency(account.balance).units}.`);
      await account.save({ transaction: bouncer.transaction });

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, account, prev_balance };

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
   * Transfers specified amount from sender's balance to recipient's balance.
   * - Does not allow sender's balance to go below sender's max debt limit.
   * - If the difference between sender's balance and the specified amount is
   * less than sender's max debt limit, then throws error.
   *
   * @param {transactingAccounts} accounts - Object containing sender and recipient.
   * involved in the transfer of funds.
   * @param {number} amount - Amount of funds to transfer.
   * @param {object} [bouncer={}]  - Optional parameters for the operation.
   * @param {object} [bouncer.transaction] - A transaction object to ensure data integrity.
   * @param {object} [bouncer.mutexes] - A mutex to acquire lock for specified entity.
   * @param {object} [bouncer.releases] - An object to release lock for specified entity.
   * @returns {Promise<object>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `instance1`: The updated instance object after the operation, if successful.
   * - `instance2`: The updated instance object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local bouncer and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   */

  async transfer(accounts, amount, bouncer={}) {
    const functionName = `${serviceName}.transfer`;

    let sender = accounts.sender;
    let recipient = accounts.recipient;
    let guests = {};
    let localBouncer = false;

    try {
      ValidationServices.isValidNumber(amount);

      if (Object.keys(bouncer).length === 0) {
        guests = {
          [sender.targetModel]: sender.id,
          [recipient.targetModel]: recipient.id
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      sender = await this.deduct(sender, amount, bouncer);
      recipient = await this.add(recipient, amount, bouncer);

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return { success: true, sender: sender.account, recipient: recipient.account };

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

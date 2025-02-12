import { FormatServices } from './format-services.js';
import { CacheServices } from './cache-services.js';
import { client } from '../client.js';
import { ErrorServices } from './error-services.js';

const serviceName = 'RelationshipLevelServices';
export const RelationshipLevelServices = {

  /**
   * Checks if barista has met the required number of orders to level up relationship with customer.
   * - Helper function
   *
   * @param {object} instance An object containing the reference to the barista's customer relations reference.
   * @returns {boolean} A boolean indicating whether or not the barista has met the orders requirement.
   *
   */

  areOrdersMet(instance) {
    const level = instance.level;
    const correct_orders_req = 10;
    const correct_orders = instance.correct_orders;

    if (!level && correct_orders >= correct_orders_req) {
      return true
    }
    return false
  },

  /**
   * Calculates the experience required to level up customer relationship status.
   * - Helper function
   *
   * @param {object} instance An object containing the reference to the barista's customer relations reference.
   * @returns {number} A number that represents the experience required to level up customer relationship status.
   *
   */

  calculateExpReq(instance) {
    const level = instance.level;
    const prev_exp_req = instance.prev_exp_req;
    const current_level_exp = instance.current_level_exp;
    let new_exp_req;
    
    if (!level) {
      new_exp_req = 50;
    }

    else if (current_level_exp >= prev_exp_req) {
      new_exp_req = level * 50 + prev_exp_req;
    }

    return new_exp_req;
  },

  /**
   * Checks barista's relationship with customer. If barista has fulfilled the required number of orders for the customer, then relationship level increases.
   *
   * @param {object} composite An object containing the identification details for the barista and customer.
   * @param {string} composite.theKey The composite key.
   * @param {object} composite.key1 An object containing the barista's information.
   * @param {string} composite.key1.id The ID of the barista.
   * @param {string} composite.key1.name The field name of the ID in the joint model.
   * @param {object} composite.key2 An object containing the customer's information.
   * @param {string} composite.key2.id The ID of the customer.
   * @param {string} composite.key2.name The field name of the ID in the joint model.
   * @param {Bouncer} bouncer Security.
   * @returns {Promise<object|null>} A promise that resolves to an object containing:
   * - `success`: A boolean indicating whether the operation was successful.
   * - `vsNpc`: The updated fighter-npc stats object after the operation, if successful.
   * - `letTheRecordState`: The updated fighter's overall stats object after the operation, if successful.
   * - `reason`: A string providing the reason or failure (if applicable).
   * @throws {Error} If local opts and an expected or unexpected error occurs, returns `success: false` and `reason: e.message`. Otherwise, throws error.
   *
   */

  async checkRelationshipLevel(composite, bouncer={}) {
    const functionName = `${serviceName}.checkRelationshipLevel`;

    const relationshipComposite = composite;
    const relationshipModel = 'UserNpcRelationship';
    relationshipComposite['targetModel'] = relationshipModel;

    const orderComposite = composite;
    const orderModel = 'UserNpccustomerOrders';
    orderComposite['targetModel'] = orderModel;

    let guests = {};
    let localBouncer = false;

    try {
      if (Object.entries(bouncer) === 0) {
        guests = {
          [relationshipModel]: composite.theKey,
          [orderModel]: composite.theKey,
        };
        bouncer = await ErrorServices.startAdvancedSquealOperations(functionName, guests);
        localBouncer = true;
      }

      const vsRelationship = await CacheServices.getOrSetCompositeCacheEntry(relationshipComposite, bouncer)
      const vsOrder = await CacheServices.getOrSetCompositeCacheEntry(orderComposite, bouncer);

      let ordersMet = false;
      let levelUp = false;

      if (!vsRelationship.level) {
        ordersMet = this.areOrdersMet(vsOrder);
        if (ordersMet) {
          vsRelationship.relationship_level = 'acquaintance';
          vsRelationship.level += 1;
          levelUp = true;
          vsRelationship.current_exp_req = this.calculateExpReq(vsRelationship);
          await vsRelationship.save({ transaction: bouncer.transaction });
        }
      }

      if (vsRelationship.level && vsRelationship.current_level_exp >= vsRelationship.current_exp_req) {
        vsRelationship.level += 1;
        levelUp = true;
        vsRelationship.prev_exp_req = vsRelationship.current_exp_req;
        vsRelationship.current_exp_req = this.calculateExpReq(vsRelationship);
        await vsRelationship.save({ transaction: bouncer.transaction });
      }

      if (localBouncer) {
        await ErrorServices.endAdvancedSquealOperations(functionName, bouncer);
      }

      return {
        success: true,
        vsRelationship,
        vsOrder,
        levelUp
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      if (localBouncer && !bouncer.transaction.finished) {
        await ErrorServices.handleAdvancedDataRollback(functionName, guests, bouncer);
        return { success: false, reason: e.message };
      }
      throw e;
    }
  }
}

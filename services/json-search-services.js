import npcJanken from '../data/npc-janken.json' assert { type: 'json' }
import kapéItems from '../data/kapé-items.json' assert { type: 'json' }
import baristaKapéItems from '../data/barista-kapé-items.json' assert { type: 'json' }
import supplies from '../data/supplies.json' assert { type: 'json' }
import baristaSupplies from '../data/barista-supplies.json' assert { type: 'json' }
import { NotFoundError } from '../errors/error-barrel.js';
import { ErrorServices } from './error-services.js';
import { logger } from '../logger.js';

const serviceName = 'JsonSearchServices';
export const JsonSearchServices = {
  async findNpc(npcIdentifier) {
    const functionName = `${serviceName}.findNpc`;
    let found;
    try {
      found = npcJanken.npcs.find(npc => npc.name === npcIdentifier || npc.descriptive_name === npcIdentifier);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  async findNpcJanken(npcIdentifier) {
    const functionName = `${serviceName}.findNpcJanken`;
    let found;
    try {
      found = npcJanken.npcs.find(npc => npc.name === npcIdentifier || npc.descriptive_name === npcIdentifier);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  findKapéItemByProperty(itemIdentifier) {
    const functionName = `${serviceName}.findKapéItem`;
    let found;
    try {
      const allKapéItems = kapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
      found = allKapéItems.find(item => item.name === itemIdentifier || item.value === itemIdentifier || item.id === itemIdentifier);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  kapéItemsLength() {
    const functionName = `${serviceName}.kafeItemsLength`;
    try {
      const allKapéItems = kapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
      return allKapéItems.length;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  findBaristaKapéDrinkItem(itemIdentifier) {
    const functionName = `${serviceName}.findBaristaKapéDrinkItem`;
    let found;
    try {
      const drinkItems = baristaKapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
      found = drinkItems.find(item => {
        if (item.modifications) {
          return item.modifications.find(item => item.name === itemIdentifier || item.value === itemIdentifier || item.id === itemIdentifier)
        }
        return item.name === itemIdentifier || item.value === itemIdentifier || item.id === itemIdentifier;
      });
      logger.log(`[TEST] ${functionName} this one:`, itemIdentifier);
      logger.log(`[TEST] ${functionName} this one:`, found);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  findBaristaKapéDrinkByIndex(index) {
    const functionName = `${serviceName}.findBaristaKapéDrinkByIndex`;
    let found;
    try {
      const drinkItems = baristaKapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
      found = drinkItems[index];
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  baristaKapéDrinkItemsLength() {
    const functionName = `${serviceName}.baristaKapéDrinkItemsLength`;
    try {
      const drinkItems = baristaKapéItems.categories.flatMap(category => category.types.flatMap(type => type.items));
      return drinkItems.length;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  async findSupplyItem(itemIdentifier) {
    const functionName = `${serviceName}.findSupplyItem`;
    let found;
    try {
      const allSupplies = supplies.categories.flatMap(category => category.groups.flatMap(group => group.items));
      found = allSupplies.find(item => item.name === itemIdentifier || item.value === itemIdentifier);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  findBaristaSupplyItem(itemIdentifier) {
    const functionName = `${serviceName}.findBaristaSupplyItem`;
    let found;
    try {
      const allBaristaSupplies = baristaSupplies.categories.flatMap(category => category.groups.flatMap(group => group.items));
      found = allBaristaSupplies.find(item => item.name === itemIdentifier || item.value === itemIdentifier);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  },

  isModified(itemIdentifier, modificationName, variationValue) {
    const functionName = `${serviceName}.isModified`;
    let found;
    try {
      if (!itemIdentifier || !modificationName || !variationValue) {
        return;
      }
      const allBaristaSupplies = baristaSupplies.categories.flatMap(category => category.groups.flatMap(group => group.items));
      found = allBaristaSupplies
        .find(item => item.name === itemIdentifier || item.value === itemIdentifier)?.modifications
        .find(modification => modification.name === modificationName)?.variations
        .find(variation => variation.value === variationValue);
      if (found) {
        return { success: true, found };
      } else {
        return { success: false };
      }
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      return { success: false, reason: e.message };
    }
  }
}

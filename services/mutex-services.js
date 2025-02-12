import { logger } from '../logger.js';
import { client } from '../client.js';
import { Mutex } from 'async-mutex';
import { ValidationServices } from './validation-services.js';
import { ErrorServices } from './error-services.js';

const serviceName = `MutexServices`;
export const MutexServices = {
  findOrCreateMutexMap(mutexName) {
    const functionName = `${serviceName}.findOrCreateMutexMap`;

    try {
      ValidationServices.validateMutex(mutexName);
      logger.debug(`[DEBUG] ${functionName} mutexName:`, mutexName);

      const mutexMaps = client.mutex;
      let MutexMap;

      if (!(mutexName in mutexMaps)) {
        logger.debug(`[DEBUG] ${functionName} ${mutexName} does not exist yet. Creating map...`);
        MutexMap = client.mutex[mutexName] = new Map();
        logger.debug(`[DEBUG] ${functionName} ${mutexName} created.`);
      } else {
        MutexMap = client.mutex[mutexName];
      }

      //logger.debug(`[DEBUG] ${functionName} MutexMap:`, MutexMap);
      return MutexMap;
    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },

  getOrSetMutex(id, mutexName) {
    const functionName = `${serviceName}.getOrSetMutex`;

    try {
      logger.debug(`[DEBUG] ${functionName} id:`, id);

      const mutexMap = this.findOrCreateMutexMap(mutexName);

      let mutex = mutexMap.get(id);

      if (!mutex) {
        mutex = new Mutex();
        mutexMap.set(id, mutex);
      }

      return mutex;

    } catch (e) {
      ErrorServices.handleError(functionName, e);
      throw e;
    }
  },
}

import { logger } from '../logger.js';
import { AppError } from './app-error.js';

export class InsufficientResourcesError extends AppError {
  constructor(depository, resource, resourceType) {
    let type;

    switch (resourceType) {
      case 'funds':
        type = 'INSUFFICIENT_FUNDS_ERROR';
        break;
      case 'supplies':
        type = 'INSUFFICIENT_SUPPLIES_ERROR';
        break;
      case 'amount':
        type = 'INSUFFICIENT_AMOUNT_ERROR';
        break;
      case 'allowance':
        type = 'INSUFFICIENT_ALLOWANCE_ERROR';
        break;
      case 'items':
        type = 'INSUFFICIENT_ITEMS_ERROR';
        break;
      default:
        type = 'INSUFFICIENT_RESOURCES_ERROR';
    }

    super(`${depository} does not have enough ${resource}.`, {type, code: 400});
    logger.error(`Depository: ${depository}, Resource: ${resource}`);
  }
}

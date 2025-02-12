import { logger } from '../logger.js';
import { AppError } from './app-error.js';

export class NotFoundError extends AppError {
  constructor(resource, model, options = {}) {
    super(`'${resource}' does not exist in '${model}'.`, {
      type: 'NOT_FOUND_ERROR', 
      code: 404,
      ...options
    });
    logger.error(`Resource: ${resource}, Depository: ${model}`);
  }
}

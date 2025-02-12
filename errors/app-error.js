export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.type = options.type || 'GENERAL_ERROR';
    this.code = options.code || 1000;
    this.isOperational = options.isOperational || true;
    this.timestamp = new Date();
  }
}

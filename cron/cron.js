const cron = require('node-cron');
const { CacheServices, UserServices } = require('../services/all-services.js');

const cronJobs = {};

function scheduleCronJob(name, cronTime, jobFunction) {
  const job = cron.schedule(cronTime, () => {
    console.log(`Running ${name}...`);
    jobFunction();
  });
  cronJobs[name] = job;
  console.log(`Cron Job '${name}' scheduled to run at: ${cronTime}`);
}

const CronServices = {
  setUpJobSchedules() {
    scheduleCronJob('Clear Cache', '0 0 * * *', CacheServices.clearAllCache);
    scheduleCronJob('Refresh Energy', '0 0 * * *', UserServices.refreshEnergy);
    console.log(`All Cron Jobs scehduled.`);
  }
}

module.exports = {
  cronJobs,
  CronServices
}

import cron from 'node-cron';
import { 
  CacheServices,
  UserServices,
  InventoryServices,
} from '../services/all-services.js';

export const cronJobs = {};

async function scheduleCronJob(name, cronTime, jobFunction) {
  const job = cron.schedule(cronTime, () => {
    console.log(`[LOG] Running ${name}...`);
    jobFunction();
  });
  cronJobs[name] = job;
  console.log(`[LOG] Cron Job '${name}' scheduled to run at: ${cronTime}`);
}

export const CronServices = {
  async setUpJobSchedules() {
    //await scheduleCronJob('Clear Cache', '0 0 * * *', CacheServices.clearAllCache);
    await scheduleCronJob('Refresh Energy', '*/6 * * * *', CacheServices.refreshEnergy);
    //await scheduleCronJob('Refresh Water Allowance', '0 * * * *', CacheServices.refreshWaterRetrievalPower);
    //await scheduleCronJob('Refresh Supplies', '0 0 * * *', CacheServices.refreshSupplies);
    console.log(`[LOG] All Cron Jobs scehduled.`);
  }
}

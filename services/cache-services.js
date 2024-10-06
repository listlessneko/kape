const { client } = require('../client.js');

const CacheServices = {
  async printCache() {
    for (let cacheName in client.cache) {
      console.log('Print Cache - Cache Name:', cacheName);
      console.log('Print Cache - Cache:', client.cache[cacheName]);
    }
  },

  async clearAllCache() {
    const excludedCache = ['commands','cooldowns', 'menus'];
    for (let cacheName in client.cache) {
      if (!excludedCache.includes(cacheName)) {
        console.log('Clear All Cache - Cache Name:', cacheName);
        client.cache[cacheName].clear();
        console.log('Clear All Cache - Cache Cleared');
      }
    }
  }
}

module.exports = {
  CacheServices
}

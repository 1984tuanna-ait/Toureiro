let helper = null;

class Helper {
  static getInstance() {
    if (!helper) {
      helper = new Helper();
    }
    return helper;
  }

  constructor() {
    const configFileName = Helper.getEnvironment();
    this.config = Helper.clone(require('../config/environments/' + configFileName + '.json'));
  }

  getConfig(key) {
    return Helper.clone(this.config[key]);
  }

  getRedisDefault() {
    return this.getConfig('redis')[0] || { db: 1 };
  }

  getRedisConfig(opts) {
    opts = opts || {};
    if (!this.redisConfig) {
      this.redisConfig = this.getRedisDefault();
    }

    Object.keys(opts).forEach(key => {
      switch (key) {
        case 'server':
          const arr = opts[key].split(':');
          this.redisConfig.host = arr[0];
          this.redisConfig.port = arr[1];
          break;
        default:
          this.redisConfig[key] = opts[key];
          break;
      }
    });
    return this.redisConfig;
  }

  getRedisServers() {
    let list = [];
    const rdCf = this.getConfig('redis');
    Object.keys(rdCf).forEach(index => {
      let cf = rdCf[index];
      list.push(cf.host + ':' + cf.port);
    });
    return list;
  }

  static getEnvironment() {
    return process.env.ENV || 'development';
  }

  static isDevelopmentEnvironment() {
    return Helper.getEnvironment() == 'development';
  }

  static clone (obj) {
    //
    // We only need to clone reference types (Object)
    //
    let copy = {};

    if (obj instanceof Error) {
      // With potential custom Error objects, this might not be exactly correct,
      // but probably close-enough for purposes of this lib.
      copy = { message: obj.message };
      Object.getOwnPropertyNames(obj).forEach(function (key) {
        copy[key] = obj[key];
      });

      return copy;
    }
    else if (!(obj instanceof Object)) {
      return obj;
    }
    else if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    for (let i in obj) {
      let o = obj[i];
      if (Array.isArray(o)) {
        copy[i] = o.slice(0);
      }
      else if (o instanceof Buffer) {
        copy[i] = o.slice(0);
      }
      else if (typeof o != 'function') {
        copy[i] = o instanceof Object ? Helper.clone(o) : o;
      }
      else if (typeof o === 'function') {
        copy[i] = o;
      }
    }

    return copy;
  }
}

module.exports = Helper;
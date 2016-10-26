const fs    = require('fs')

module.exports = class ConnUtils {

  static create(host, config, cb) {
    let connection = new SSH();

    connection.once('ready', function () {
      return cb(null, connection);
    })
    connection.once('error', function (err) {
      return cb(err);
    })

    // normalize configuration
    config.host = host;
    config.username = config.user;
    if (config.key) {
      try {
        config.privateKey = fs.readFileSync(config.key)
      } catch (err) {
        return cb(err);
      }
    }

    connection.connect(Object.assign(config, config.ssh_options));
  }
}
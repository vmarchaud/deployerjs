
"use strict";

const fs    = require('fs')
const SSH   = require('ssh2').Client
const os    = require('os')

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

    
    // resolve path of private key if given
    if (config.key || config.privateKey) {
      try {
        let path = config.key || config.privateKey;
        path = path.indexOf('~') !== -1 ? path.replace('~', os.homedir()) : path;
        config.privateKey = fs.readFileSync(path)
      } catch (err) {
        return cb(err);
      }
    }

    try {
      connection.connect(Object.assign(config, config.ssh_options));
    } catch (err) {
      // the error is encoding too long mean that the passphrase is incorrect
      return cb(new Error('Bad passphrase provided for ssh private key'));
    }
  }
}
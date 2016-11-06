
"use strict";

const fs    = require('fs')
const SSH   = require('ssh2').Client
const os    = require('os')

module.exports = class ConnUtils {

  static create(host, server, cb) {
    let connection = new SSH();

    connection.once('ready', function () {
      server.reporter.fine(server.name, 'SSH connection is ready')
      return cb(null, connection);
    })
    connection.once('error', function (err) {
      return server.reporter.fine(err, cb);
    })

    // normalize configuration
    server.host = host;
    server.username = server.user || server.username;
    
    // resolve path of private key if given
    if (server.key || server.privateKey) {
      server.reporter.fine(server.name, 'Resolving SSH key provided in configuration.')
      try {
        let path = server.key || server.privateKey;
        path = path.indexOf('~') !== -1 ? path.replace('~', os.homedir()) : path;
        server.privateKey = fs.readFileSync(path)
        server.reporter.fine('SSH key has been succesfully fetched from fs')
      } catch (err) {
        return cb(err);
      }
    }

    try {
      server.reporter.fine(server.name, 'Initialization of the ssh connection')
      connection.connect(Object.assign(server, server.ssh_options));
    } catch (err) {
      // the error is encoding too long mean that the passphrase is incorrect
      return cb(new Error('Bad passphrase provided for ssh private key'));
    }
  }
}
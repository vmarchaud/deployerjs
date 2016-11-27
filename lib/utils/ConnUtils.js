
"use strict";

const fs    = require('fs')
const SSH   = require('ssh2').Client
const os    = require('os')
const util  = require('util')

module.exports = class ConnUtils {

  static create(host, server, cb) {
    let connection = new SSH();

    connection.once('ready', function () {
      server.reporter.fine(server.name, 'SSH connection is ready')
      return cb(null, connection);
    })
    connection.once('error', function (err) {
      server.reporter.error(err);
      return cb(err);
    })

    // normalize configuration
    server.host = host;
    server.username = server.user || server.username;

    // remove end slash if present
    if (server.path[server.path.length - 1] === '/')
      server.path = server.path.substr(0, server.path.length - 1)

    // set port if contained in hostname
    if (server.host.indexOf(':') !== -1) {
      let tmp = server.host.split(':');
      server.host = tmp[0], server.port = tmp[1];
    }
    
    // resolve path of private key if given or if there isn't any password configured
    if (server.key || server.privateKey || !server.password) {
      server.reporter.fine(server.name, 'Resolving SSH key')
      try {
        let path = server.key || server.privateKey || '~/.ssh/id_rsa';
        path = path.indexOf('~') !== -1 ? path.replace(/~/g, os.homedir()) : path;
        server.privateKey = fs.readFileSync(path)
        server.reporter.fine('SSH key has been succesfully fetched from fs')
      } catch (err) {
        return cb(err);
      }
    }

    // build env if provided in configuration
    if (server.env) {
      let builder = '';
      for (let key in server.env)
        builder = util.format('%s%s=%s ', builder, key, server.env[key]);
      server.env = builder;
    } else
      server.env = '';

    try {
      server.reporter.fine(server.name, 'Initialization of the ssh connection')
      if (typeof(server.ssh_options) !== "object" || server.ssh_options instanceof Array)
        server.ssh_options = {};
      connection.connect(Object.assign(server, server.ssh_options));
    } catch (err) {
      // the error is encoding too long mean that the passphrase is incorrect
      return cb(new Error('Bad passphrase provided for ssh private key'));
    }
  }
}
var SSH = require('ssh2').Client;
var async = require('async');
var readline = require('readline');
var Spinner = require('multispinner');
var fs = require('fs');

const SpinnerReporter = require('./reporters/SpinnerReporter')
const DeployUtils = require('./utils/DeployUtils')
const GitStrategy = require('./strategies/GitStrategy')

module.exports = class Deployer {

  constructor(conf) {
    this.envs = conf;
    this.groups = {};

    // compute group of each env if defined
    for (env in conf) {
      if (!env || !env.group) continue;

      if (groups[env.group])
        groups[env.group].push(env);
      else {
        groups[env.group] = [];
        groups[env.group].push(env);
      }
    }
  }

  /**
   * Function called to any remote action, for example ask for credentials like ssh password or private key passphrase
   * 
   * @param {String} target   A declared environement OR a group of declared environements
   * @param {Function} cb(err, servers)   Callback called after preparation completed
  */
  select(target, cb) {
    var servers = DeployerUtils.resolveServers(this.envs, this.groups, target);
    // an error is returned (malformed config)
    if (servers instanceof Error) return cb(servers);

    // instanciate the reporter as soon as we got all servers
    this.reporter = new SpinnerReporter(servers);

    async.each(Object.keys(servers), function (server_name, next) {
      var server = servers[server_name];
      server.name = server_name;

      // if password or passphrase is a boolean (and true), the user must enter credentials for each server
      if ((typeof (server.password) === 'boolean' && server.password) || (typeof (server.passphrase) === 'boolean' && server.passphrase)) {
        var type = server.password ? 'password' : 'passphrase';

        DeployerUtils.ask('You need to provide a ' + type + ' for server ' + server_name, (res) => {
          server[type] = value;
          return next(null);
        })
      }
      else
        return next(null);
    }, function (err) {
      return cb(err, servers);
    })
  }

  /**
   * Function called to make remote deployement on each remove servers
   * 
   * @param {Object} servers  Map with host for key and configuration in value
   */
  deploy(servers, cb) {
    async.each(servers, (server, next) => {
      // create ssh connection to the hostname
      DeployerUtils.createConnection(server_name, server, (err, conn) => {
        if (err) return this.reporter.error(server_name, err, next);

        reporter.update(server_name, 'Verification of remote system');
        // choose the strategy
        server.strategy = new GitStrategy(server, conn, reporter);

        // ensure that the remote system is already setup
        DeployerUtils.ensureSetup(this.reporter, server, conn, (err, msg) => {
          if (err) return this.reporter.error(server_name, err, next);

          reporter.update(server_name, msg);
          // need to pull
        })
      })
    }, function (err, results) {

    })
  }
}

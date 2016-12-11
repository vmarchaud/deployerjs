
"use strict";

var async             = require('async');
var util              = require('util')

const SpinnerReporter = require('./reporters/StdReporter')
const DeployUtils     = require('./utils/DeployUtils')
const GitStrategy     = require('./strategies/GitStrategy')
const ConnUtils       = require('./utils/ConnUtils')
const HookUtils       = require('./utils/HookUtils')
const config          = require('./utils/config')

module.exports = class Deployer {

  constructor(conf, opts) {
    this.envs = typeof(conf) === 'string' ? JSON.parse(conf) : conf;
    this.groups = {};
    opts = opts ? opts : {};
    if (typeof(this.envs) !== 'object')
      throw new Error('Invalid configuration object');

    // compute group of each env if defined
    for (let key in this.envs) {
      let env = this.envs[key];
      if (!env.group) continue;

      if (!this.groups[env.group])
        this.groups[env.group] = {};

      this.groups[env.group][key] = env;
    }

    // resolve global reporter from opts
    if (typeof(opts.reporter) === 'string') {
      let resolved = config.reporters[opts.reporter.toUpperCase()];
      this.reporter = resolved ? resolved : config.reporters.STD; 
    }
    else if (typeof(opts.reporter) === 'function')
      this.reporter = opts.reporter;
    else
      this.reporter = config.reporters.STD;

    // resolve global strategy from opts
    if (typeof(opts.strategy) === 'string') {
      let resolved = config.strategies[opts.strategy.toUpperCase()];
      this.strategy = resolved ? resolved : config.strategies.GIT; 
    }
    else if (typeof(opts.strategy) === 'function')
      this.strategy = opts.strategy;
    else
      this.strategy = config.strategies.GIT;
  }

  /**
   * Function called to any remote action, for example ask for credentials like ssh password or private key passphrase
   * Must be called before any action since its resolve password / passphrase
   * 
   * @param {String} target   A declared environement OR a group of declared environements
   * @param {Function} cb(err, servers)   Callback called after preparation completed
  */
  select(target, opts, cb) {
    if (!cb) cb = opts;
    var servers = DeployUtils.resolveServers(this.envs, this.groups, target);
    // an error is returned (malformed config)
    if (servers instanceof Error) return cb(servers);

    async.each(Object.keys(servers), function (server_name, next) {
      var server = servers[server_name];
      server.name = server_name;

      // if password or passphrase is a boolean (and true), the user must enter credentials for each server
      if ((typeof (server.password) === 'boolean' && server.password) || (typeof (server.passphrase) === 'boolean' && server.passphrase)) {
        var type = server.password ? 'password' : 'passphrase';

        DeployUtils.askUser(util.format('[DEPLOYER] You need to provide a %s for server %s : ', type, server_name), (value) => {
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
  deploy(servers, opts, cb) {
    if (!cb) cb = opts;
    // instanciate reporter that has been configured
    this.reporter = new this.reporter(servers);

    async.each(servers, (server, next) => {
      // we will push all data in this field to make a detailed report of all data we got
      server.details = [];
      server.reporter = this.reporter;

      // create ssh connection to the hostname
      ConnUtils.create(server.name, server, (err, conn) => {
        if (err) return this.reporter.error(server.name, err, next);

        this.reporter.info(server.name, 'Verification of remote system');
        server.conn = conn;
        server.strategy = new this.strategy(server);

        // ensure that the remote system is already setup
        DeployUtils.ensureSetup(server, (err) => {
          if (err) return this.reporter.error(server.name, err, next);

          this.reporter.info(server.name, 'Remote system is ready !')
          server.strategy.update((err) => {
            if (err) return this.reporter.error(server.name, err, next);

            HookUtils.call('post-deploy', server, (err) => {
              return err ? this.reporter.error(server.name, err) :
                  this.reporter.success(server.name, 'Remote system updated', next);
            })
          })
        })
      })
    }, function (err, results) {
      // clean all connections
      for(let server in servers) {
        if (servers[server].conn)
          servers[server].conn.end() 
      }
      return cb(err, results);
    })
  }

  /**
   * Function called to make rollback on remote environements
   * 
   * @param {Object} servers  Map with host for key and configuration in value
   */
  rollback(servers, opts, cb) {
    if (!cb) cb = opts;

    // instanciate reporter that has been configured
    this.reporter = new this.reporter(servers);

    // resolve rollback number
    opts.rollback = opts.rollback ? typeof(opts.rollback) !== 'number' ? 
        parseInt(opts.rollback) || config.rollback : opts.rollback: config.rollback;

    async.each(servers, (server, next) => {
      // we will push all data in this field to make a detailed report of all data we got
      server.details = [];
      server.reporter = this.reporter;

      // create ssh connection to the hostname
      ConnUtils.create(server.name, server, (err, conn) => {
        if (err) return this.reporter.error(server.name, err, next);

        this.reporter.info(server.name, 'Verification of remote system');
        server.conn = conn;
        server.strategy = new this.strategy(server);

        // ensure that the remote system is already setup
        DeployUtils.ensureSetup(server, (err) => {
          if (err) return this.reporter.error(server.name, err, next);

          this.reporter.info(server.name, 'Remote system is ready !')
          server.strategy.rollback(opts.rollback, (err) => {
            if (err) return this.reporter.error(server.name, err, next);

            HookUtils.call('post-rollback', server, (err) => {
              return err ? this.reporter.error(server.name, err) :
                  this.reporter.success(server.name, 'Remote system has been rollback of ' + opts.rollback + " releases", next);
            })
          })
        })
      })
    }, function (err, results) {
      // clean all connections
      for(let server in servers) {
        if (servers[server].conn)
          servers[server].conn.end() 
      }
      return cb(err, results);
    })
  }
}

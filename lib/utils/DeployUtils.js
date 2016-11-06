
"use strict";

const async       = require('async');
const readline    = require('readline');
const util        = require('util');
const HookUtils   = require('./HookUtils')

const FileState = {
  VALID: 0,
  INVALID: 1,
  NOT_FOUND: 2
}

module.exports = class DeployUtils {

  /**
   * Function used to verify that the remote path is correctly setup (good folder etc)
   * 
   */
  static ensureSetup(server, cb) {
    server.conn.sftp((err, sftp) => {
      if (err) return cb(err);

      sftp.readdir(server.path, (err, list) => {
        if (err) return cb(err);

        // retrieve both entry based on the name
        let current, source ;
        for (let entry of list) {
          if (entry.filename === 'current')
            current = entry;
          else if (entry.filename === 'source')
            source = entry;
        }

        let opts = { 
          current: current ? (current.longname[0] === 'l' ? FileState.VALID : FileState.INVALID) : FileState.NOT_FOUND,
          source: source ? (source.longname[0] === 'd' ? FileState.VALID : FileState.INVALID) : FileState.NOT_FOUND
        };

        // if any of both folder is invalid or inexistant, setup the remote system
        if (opts.current !== FileState.VALID || opts.source !== FileState.VALID)
          return DeployUtils.setup(server, opts, cb);
        else
          return cb(null);
      })
    })
  }

  /**
   * Function used to setup remote system
   * 
   */
  static setup(server, opts, cb) {
    server.reporter.info(server.name, 'Incorrect setup detected, fixing now ..');
    async.series([
      // if the remote source folder already exist, move him
      function (next) {
        if (opts.source !== FileState.INVALID) return next(null);
        
        server.conn.sftp((err, sftp) => {
          if (err) return next(err);

          server.reporter.info(server.name, 'Making a backup of remote source folder');
          sftp.rename(server.path + '/source', server.path + '/source_old', next)
        })
      },
      // if the remote current link isn't a link, move him too
      function (next) {
        if (opts.current !== FileState.INVALID) return next(null);

        server.conn.sftp((err, sftp) => {
          if (err) return next(err);

          server.reporter.info(server.name, 'Making a backup of remote current folder');
          sftp.rename(server.path + '/current', server.path + '/current_old', next)
        })
      },
      // at this point we either valid or inexistant folder, so create it if needed
      function (next) {
        if (opts.source !== FileState.NOT_FOUND) return next(null);

        server.conn.sftp((err, sftp) => {
          if (err) return next(err);

          server.reporter.info(server.name, 'Creating source folder');
          sftp.mkdir(server.path + '/source', next);
        })
      },
      // create symlink if needed
      function (next) {
        if (opts.current !== FileState.NOT_FOUND) return next(null);

        server.conn.sftp((err, sftp) => {
          if (err) return next(err);

          server.reporter.info(server.name, 'Create current symlink to current');
          sftp.symlink(server.path + '/source', server.path + '/current', next);
        })
      },
      // now we have a valid remote setup, so if the source folder wasn't already here, call hooks
      function (next) {
        if (opts.source === FileState.VALID) return next(null);

        // execute pre-hook
        HookUtils.call('pre-setup', server, (err) => {
          if (err) return next(err)
          server.strategy.retrieve((err) => {
            if (err) return next(err)
            HookUtils.call('post-setup', server, next)
          })
        })
      }
    ], cb)
  }

  static resolveServers(envs, groups, name) {
    var hosts = {}, env = envs[name];

    // its a environement, extract value of host
    if (env && env.host) {
      if (typeof (env.host) === 'string')
        hosts[env.host] = env;
      else if (env.host instanceof Array) {
        env.host.forEach( (host) => {
          hosts[host] = env;
        })
      }
      return hosts;
    }
    // its a group, parkour all
    else if (groups[name]) {
      for (let env in groups[name]) {
        if (typeof (env.host) === 'string')
          hosts[env.host] = env;
        else if (env.host instanceof Array) {
          env.host.forEach( (host) => {
            hosts[host] = env;
          })
        }
      }
      return hosts;
    }
    // should never happen, but you know just in case
    else
      return new Error('Environement/Group provided not found');
  }


  static askUser(query, cb) {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    var stdin = process.openStdin();
    process.stdin.on("data", function (char) {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.pause();
          break;
        default:
          process.stdout.write("\x1B[2K\x1B[200D" + query + Array(rl.line.length + 1).join("*"));
          break;
      }
    });

    rl.question(query, (value) => {
      rl.close();
      return cb(value);
    });
  }
}
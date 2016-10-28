const ssh2 = require('ssh2').Client;
const async = require('async');
const readline = require('readline');
const util      = require('util');
module.exports = class DeployUtils {

  /**
   * Function used to verify that the remote path is correctly setup (good folder etc)
   * 
   */
  static ensureSetup(server, conn, cb) {
    conn.sftp((err, sftp) => {
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

        // if source isnt a folder and current isnt a symlink, setup the folder
        if (!current && !source)
          return DeployUtils.setup(server, conn, true, cb);
        else if (source.longname[0] !== 'd' || current.longname[0] !== 'l')
          return DeployUtils.setup(server, conn, false, cb);
        else
          return cb(null);
      })
    })
  }

  /**
   * Function used to setup remote system
   * 
   */
  static setup(server, conn, empty, cb) {
    async.series([
      function (next) {
        if (empty) return next(null);
        
        conn.sftp((err, sftp) => {
          if (err) return next(err);

          // if not empty, we will make a backup of source folder and remove current symlink
          server.reporter.update(server.name, 'Making a backup of remote setup');

          sftp.rename(server.path + '/source', server.path + '/source_old', (err) => {
            if (err) return next(err);

            sftp.unlink(server.path + '/current', next)
          })
        })
      },
      function (next) {
        conn.sftp((err, sftp) => {
          if (err) return next(err);

          // setup folder and link
          server.reporter.update(server.name, 'Creating folder/symlink on remote system');

          sftp.mkdir(server.path + '/source', (err) => {
            if (err) return next(err);

            sftp.symlink(server.path + '/source', server.path + '/current', next)
          })
        })
      },
      // retrieve the application with current strategy
      function (next) {
        server.strategy.retrieve(next);
      }
    ], function (err) {
      if (err) return server.reporter.error(server.name, err, cb);

      // continue the flow
      return server.reporter.update(server.name, 'Remote system is ready', cb);
    })
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
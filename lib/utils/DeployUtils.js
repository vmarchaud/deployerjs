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
        var current = list.filter((item) => {
          item.filename === 'current';
        })[0]
        var source = list.filter((item) => {
          item.filename === 'source';
        })[0]

        // if source isnt a folder and current isnt a symlink, setup the folder
        if (!current && !source)
          return DeployUtils.setup(server, conn, true, cb);
        else if (source.longname[0] !== 'd' || current.longname[0] !== 'n')
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
      // ensure that  
      function (next) {
        conn.sftp((err, sftp) => {
          if (err) return server.reporter.error(server.name, err, cb);

          if (empty) return next(null)
          // if not empty, we will make a backup of source folder and remove current symlink

          server.reporter.update(server.name, 'Making a backup of remote setup')

          sftp.rename(server.path + '/source', server.path + '/source_old', (err) => {
            if (err) return next(err);

            sftp.unlink(server.path + '/current', (err) => {
              return next(err);
            })
          })
        })
      },
      function (next) {
        conn.sftp((err, sftp) => {
          if (err) return server.reporter.error(server.name, err, cb);

          // setup folder and link
          server.reporter.update(server.name, 'Creating folder/symlink on remote system')

          sftp.mkdir(server.path + '/source', (err) => {
            if (err) return next(err);

            sftp.symlink(server.path + '/source', server.path + '/current', (err) => {
              return next(err);
            })
          })
        })
      },
      function (next) {
        server.ref = server.ref.split('/');
        let origin = server.ref[0] || 'origin';
        let branch = server.ref[1] || 'master';

        // try git clone the repo into the remote source folder
        server.reporter.update(server.name, 'Git cloning in source folder')

        var command = util.format('git clone %s -o %s -b %s %s', server.repo, origin, branch, server.path + '/source'); 
        conn.exec(command, function (err, stream) {
          if (err) return next(err);

          stream.on('close', function (code, signal) {
            if (code !== 0)
              return next(new Error('Git clone failed with code ' + code));
            else
              return next(null);
          });
        });
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
    if (env && !env.host) {
      if (typeof (env.host) === 'string')
        hosts[env.host] = env;
      else if (env.host instanceof Array) {
        for (hostname in env.host)
          hosts[hostame] = env.host;
      }
      return hosts;
    }
    // its a group, parkour all
    else if (groups[name]) {
      for (env in groups[name]) {
        if (typeof (env.host) === 'string')
          hosts[env.host] = env;
        else if (env.host instanceof Array) {
          for (hostname in env.host)
            hosts[hostame] = env.host;
        }
      }
      return hosts;
    }
    // should never happen, but you know in case of
    else
      return new Error('Environement/Group provided not found');
  }


  static askUser(question, cb) {
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
          process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length + 1).join("*"));
          break;
      }
    });

    rl.question(question, function (value) {
      value = value || '';

      rl.close();
      return cb(value);
    });
  }

}
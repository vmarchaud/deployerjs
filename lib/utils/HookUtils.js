
"use strict";

const util      = require('util')
const async     = require('async')
const exec      = require('child_process').exec

module.exports = class HookUtils {
  
  /**
   *  Function used to call a configured hook (if exist) on the remote system
   */
  static callRemote(hook, server, cb) {
    if (!server[hook])
      return cb(null);
    if (typeof(server[hook]) !== 'string')
      return cb(new Error(`Remote '${hook}' hook configured is not a string`));
    
    server.reporter.update(server.name, `Executing ${hook} on remote system`);
    server.conn.exec(util.format('cd %s ; %s', server.path + '/current', server[hook]), (err, stream) => {
      if (err) return cb(err);
      stream.on('close', (code, signal) => {
        server.reporter.update(server.name, `${hook} hook returned code ${code}`, cb);
      }).on('data', (data) => {})
    })
  }

  /**
   * Function used to call a configured hook (if exist) on the local system
   */
  static callLocal(hook, server, cb) {
    if (!server[hook])
      return cb(null);
    if (typeof(server[hook]) !== 'string')
      return cb(new Error(`Local '${hook}' hook configured is not a string`));
    
    server.reporter.update(server.name, `Executing ${hook} on local system`);
    let spawnedProcess = exec(server[hook], (err, stdout, stderr) => {
      if (err) return cb(err);

      return server.reporter.update(server.name, `${hook} hook returned code 0`, cb);
    });
  }

  /**
   * Function used to call both hook (remote and local) asynchronously
   */
  static call(hook, server, cb) {
    async.parallel([
      function (next) {
        HookUtils.callLocal(hook + '-local', server, next);
      },
      function (next) {
        HookUtils.callRemote(hook, server, next);
      }
    ], cb);
  }
}
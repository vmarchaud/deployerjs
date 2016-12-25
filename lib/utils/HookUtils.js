
'use strict'

const util = require('util')
const async = require('async')
const exec = require('child_process').exec

module.exports = class HookUtils {

  /**
   *  Function used to call a configured hook (if exist) on the remote system
   */
  static callRemote (hook, server, cb) {
    if (!server[hook]) { return cb(null) }
    if (typeof (server[hook]) !== 'string') {
      return cb(new Error(`Remote '${hook}' hook configured is not a string`))
    }

    server.reporter.info(server, `Executing ${hook} on remote system`)
    let stderr = ''
    let stdout = ''

    server.conn.shell((err, stream) => {
      if (err) return cb(err)

      stream.on('close', (code, signal) => {
        server.reporter.fine(server, { hook: hook, code: code, stdout: stdout || 'empty', stderr: stderr || 'empty' })
        return server.reporter.info(server, `${hook} hook returned code ${code}`, cb)
      }).on('data', (data) => {
        stdout += data instanceof Buffer ? data.toString() : data
      }).stderr.on('data', (data) => {
        stderr += data instanceof Buffer ? data.toString() : data
      })

      stream.end(util.format('cd %s ; %s %s \nexit\n', server.path + '/current', server.env, server[hook]))
    })
  }

  /**
   * Function used to call a configured hook (if exist) on the local system
   */
  static callLocal (hook, server, cb) {
    if (!server[hook]) {
      return cb(null)
    }
    if (typeof (server[hook]) !== 'string') {
      return cb(new Error(`Local '${hook}' hook configured is not a string`))
    }

    server.reporter.info(server, `Executing ${hook} on local system`)

    exec(server[hook], (err, stdout, stderr) => {
      if (err) return cb(err)

      server.reporter.fine(server, { hook: hook, code: 0, stdout: stdout || '', stderr: stderr || '' })
      return server.reporter.info(server, `${hook} hook returned code 0`, cb)
    })
  }

  /**
   * Function used to call both hook (remote and local) asynchronously
   */
  static call (hook, server, cb) {
    async.parallel([
      function (next) {
        HookUtils.callLocal(hook + '-local', server, next)
      },
      function (next) {
        HookUtils.callRemote(hook, server, next)
      }
    ], cb)
  }
}

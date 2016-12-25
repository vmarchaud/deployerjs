
'use scrict'

const crypto = require('crypto')
const ssh2 = require('ssh2')
const utils = ssh2.utils
const EventEmitter = require('events')

class EventBus extends EventEmitter {}

export class ServerWrapper {

  static buildServer (opts) {
    if (opts.privateKey && !opts.publicKey) {
      opts.publicKey = utils.genPublicKey(opts.privateKey)
    }
    const eventBus = new EventBus()
    const server = new ssh2.Server({
      hostKeys: [ opts.privateKey ]
    }, function (client) {
      client.on('authentication', (ctx) => {
        if (this.methods.indexOf(ctx.method) < 0) {
          return ctx.reject()
        }
        // auth using password
        if (ctx.method === 'password' &&
            ctx.username === opts.userrname &&
            ctx.password === opts.password) {
          return ctx.accept()
        }
        // auth using public key
        if (ctx.method === 'publickey' && ctx.key.algo === opts.publicKey.fulltype &&
            ctx.key.data.equals(opts.publicKey.public)) {
          if (!ctx.signature) return ctx.accept()

          var verifier = crypto.createVerify(ctx.sigAlgo)
          verifier.update(ctx.blob)
          return verifier.verify(opts.pubKey.publicOrig, ctx.signature)
              ? ctx.accept() : ctx.reject()
        }
      }).on('ready', () => {
        client.on('session', (accept, reject) => {
          eventBus.emit('session', accept())
        })
      }).on('end', () => {
        client.emit('disconnect')
      })
    }).listen(opts.port, opts.host, () => {})
    return { bus: eventBus, server: server }
  }
}

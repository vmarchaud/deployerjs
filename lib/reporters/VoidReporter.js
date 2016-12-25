
'use strict'

module.exports = class VoidReporter {

  constructor (entries) {
    this._entries = entries

    this._details = {}
    for (let entry in entries) {
      this._details[entry] = []
    }
  }

  /**
   * Info log, will be printed and added to details
   *
   * @param {string} entry            the entry name
   * @param {string} msg              the message that will be displayed
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  info (entry, msg, cb) {
    if (!this._entries[entry]) { return }
    this._details[entry].push(msg)

    return cb ? cb(null, msg) : true
  }

  /**
   * Error log, will be printed and added to details
   *
   * @param {string} entry            the entry name
   * @param {string} msg              the error instance that has caused the problem
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  error (entry, err, cb) {
    if (!this._entries[entry]) {
      return
    }
    this._details[entry].push(err.message || err)

    return cb ? cb(err) : true
  }

  /**
   * Success log, will be printed and added to details
   *
   * @param {string} entry            the entry name
   * @param {string} msg              the message that will be displayed
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  success (entry, msg, cb) {
    if (!this._entries[entry]) {
      return
    }
    this._details[entry].push(msg)

    return cb ? cb(null, msg) : true
  }

  /**
   * Fine log, will not be printed but will be added in details
   */
  fine (entry, msg, cb) {
    if (!this._entries[entry]) {
      return
    }
    this._details[entry].push(msg)

    return cb ? cb(null, msg) : true
  }

  /**
   * Will return detailed data for entry provided
   *
   * @param {string} entry            the entry name
   */
  details (entry) {
    return this._details[entry]
  }
}

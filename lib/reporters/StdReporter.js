
"use strict";

var util = require('util');

module.exports = class StdReporter {

  constructor(entries) {
    this._entries = entries;
  }

  /**
   * Called when an entry text need to be updated
   * 
   * @param {string} entry            the entry name
   * @param {string} msg              the message that will be displayed
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  update(entry, msg, cb) {
    if (this._entries.indexOf(entry) === -1)
      return;
    console.log('[INFO] %s - %s', entry, msg)

    return cb ? cb(null, msg) : true;
  }

  /**
   * Called when an entry is errored
   * 
   * @param {string} entry            the entry name
   * @param {string} msg              the error instance that has caused the problem
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  error(entry, err, cb) {
    if (this._entries.indexOf(entry) === -1)
      return;
    console.log('[ERROR] %s - %s', entry, err.message || err)

    return cb ? cb(err) : true;
  }

  /**
   * Called when an entry has finished
   * 
   * @param {string} entry            the entry name
   * @param {string} msg              the message that will be displayed
   * @param {function} cb(err, msg)   callback that will be called after (usefull for chaining)
   */
  success(entry, msg, cb) {
    if (this._entries.indexOf(entry) === -1)
      return;
    console.log('[SUCCESS] %s - %s', entry, msg)

    return cb ? cb(null, msg) : true;
  }
}
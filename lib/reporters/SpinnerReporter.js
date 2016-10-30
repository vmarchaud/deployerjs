
"use strict";

var Spinner = require('multispinner');

module.exports = class SpinnerReporter {

  constructor(entries) {
    this._entries = entries;
    this.spinners = new Spinner(entries, { 
      postSpace: ' : ',
      color : {
        'incomplete': 'gray',
        'success': 'green',
        'error': 'red'
      }
    });
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
    this.spinners.updateText(entry, { postText: msg });

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
    this.spinners.updateText(entry, { postText: err.message || err });
    this.spinners.error(entry);
    this.spinners.loop();

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
    this.spinners.updateText(entry, { postText: msg || 'Success' });
    this.spinners.success(entry);
    this.spinners.loop();

    return cb ? cb(null, msg) : true;
  }
}
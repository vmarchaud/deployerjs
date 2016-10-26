
const Strategy = require('./Strategy.js')

module.exports = class GitStrategy {

  constructor(server, conn, reporter) {
    this.reporter = reporter;
    this.server = server;
    this.conn = conn;
  }


}
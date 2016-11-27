
"use strict";

const util        = require('util')

module.exports = class GitStrategy {

  constructor(server) {

    this.reporter = server.reporter;
    this.server = server;
    this.conn = server.conn;

    let ref = this.server.ref.split('/');
    this.server.origin = this.server.origin || ref[0] ||  'origin';
    this.server.branch = this.server.branch || ref[1] || 'master';
  }

  retrieve (cb) {
    // try git clone the repo into the remote source folder
    this.server.reporter.info(this.server.name, 'Retrieving repo in source folder (GIT)')

    let command = util.format('git clone %s -o %s -b %s %s', 
      this.server.repo, this.server.origin, this.server.branch, this.server.path + '/current');
    let stderr = "", stdout = "";
    
    this.conn.shell((err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        this.server.reporter.fine(this.server.name, { code: code, stdout: stdout || 'empty', stderr: stderr || 'empty' });
        return code !== 0 ? cb(new Error(util.format('Git pull failed with code %d', code))) : cb(null);
      }).on('data', (data) => {
        stdout += data instanceof Buffer ? data.toString() : data;
      }).stderr.on('data', (data) => {
        stderr += data instanceof Buffer ? data.toString() : data;
      });
      stream.end(command + "\nexit\n")
    });
  }

  update (cb) {
    // try git reset to head in the repo
    this.server.reporter.info(this.server.name, 'Updating repository from remote (GIT)')

    let command = util.format('cd %s ; git reset --hard %s', this.server.path + '/current', this.server.ref);
    let stderr = "", stdout = "";

    this.conn.shell((err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        this.server.reporter.fine(this.server.name, { code: code, stdout: stdout || 'empty', stderr: stderr || 'empty' });
        return code !== 0 ? cb(new Error(util.format('Git reset to HEAD failed with code %d', code))) : cb(null);
      }).on('data', (data) => {
        stdout += data instanceof Buffer ? data.toString() : data;
      }).stderr.on('data', (data) => {
        stderr += data instanceof Buffer ? data.toString() : data;
      });
      stream.end(command + "\nexit\n")
    });
  }

  rollback (nbr, cb) {
    // try git reset to head in the repo
    this.server.reporter.info(this.server.name, 'Updating repository from remote (GIT)')

    let command = util.format('cd %s ; git reset --hard HEAD~%d', this.server.path + '/current', nbr);
    let stderr = "", stdout = "";

    this.conn.shell((err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        this.server.reporter.fine(this.server.name, { code: code, stdout: stdout || 'empty', stderr: stderr || 'empty' });
        return code !== 0 ? cb(new Error(util.format('Git reset to HEAD~%d failed with code %d', nbr, code))) : cb(null);
      }).on('data', (data) => {
        stdout += data instanceof Buffer ? data.toString() : data;
      }).stderr.on('data', (data) => {
        stderr += data instanceof Buffer ? data.toString() : data;
      });
      stream.end(command + "\nexit\n")
    });
  }
}
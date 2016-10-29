
const util      = require('util')

module.exports = class GitStrategy {

  constructor(server) {

    this.reporter = server.reporter;
    this.server = server;
    this.conn = server.conn;

    let ref = this.server.ref.split('/');
    this.server.origin = ref[0] || 'origin';
    this.server.branch = ref[1] || 'master';
  }

  retrieve (cb) {
    // try git clone the repo into the remote source folder
    this.server.reporter.update(this.server.name, 'Retrieving repo in source folder (GIT)')

    let command = util.format('git clone %s -o %s -b %s %s', 
      this.server.repo, this.server.origin, this.server.branch, this.server.path + '/source');
    
    this.conn.exec(command, (err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        if (code !== 0)
          return cb(new Error(util.format('Git pull failed with code %d', code)));
        else
          return cb(null);
      }).on('data', (data) => {});
    });
  }

  update (cb) {
    // try git reset to head in the repo
    this.server.reporter.update(this.server.name, 'Updating repository from remote (GIT)')

    let command = util.format('cd %s ; git reset --hard %s', this.server.path + '/source', this.server.ref);

    this.conn.exec(command, (err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        if (code !== 0)
          return cb(new Error(util.format('Git reset to HEAD failed with code %d', code)));
        else
          return cb(null);
      }).on('data', (data) => {});
    });
  }

  revert (nbr, cb) {
    // try git reset to head in the repo
    this.server.reporter.update(this.server.name, 'Updating repository from remote (GIT)')

    let command = util.format('cd %s ; git reset --hard HEAD~%d', this.server.path + '/source', nbr);

    this.conn.exec(command, (err, stream) => {
      if (err) return cb(err);

      stream.on('close', (code, signal) => {
        if (code !== 0)
          return cb(new Error(util.format('Git reset to HEAD~%d failed with code %d', nbr, code)));
        else
          return cb(null);
      }).on('data', (data) => {});
    });
  }
}
#!/usr/bin/env node

'use strict';

const Deployer  = require('../lib/Deployer')
const pkg       = require('../package.json')
const commander = require('commander')
const fs        = require('fs')
const path      = require('path')

commander
  .version(pkg.version)
  .option('-s, --strategy [git]', 'set the strategy used to balance connection (default to git)', 'git')
  .option('-r, --reporter [std]', 'change reporter used to print informations (default to stdout)', 'std')
  .on('--help', () => {
    console.log('');
    console.log('-----> DeployerJs CLI Help');
    console.log('');
    console.log('  Commands:');
    console.log('    deploy               update remote to the latest release');
    console.log('    revert [n]           revert to [n]th last deployment or 1');
    console.log('    curr[ent]            output current release commit');
    console.log('    prev[ious]           output previous release commit');
    console.log('    exec <cmd>           execute the given <cmd>');
    console.log('    list                 list previous deploy commits');
    console.log('');
  })
  .command('deploy <environement|group> [file]')
    .description('deploy the code in your remote environement')
    .alias('update')
    .action((environement, file) => {
      // instanciate api
      var deployer = new Deployer(resolveConf(file), {
        strategy: commander.strategy,
        reporter: commander.reporter
      })

      // select and deploy
      deployer.select(environement, (err, servers) => {
        if (err) return exit(err);
        deployer.deploy(servers, exit)
      })
    });

commander.parse(process.argv);

function resolveConf(confPath) {
  let file;
  confPath = path.resolve(process.cwd(), confPath || 'ecosystem.json');
  try {
    file = JSON.parse(fs.readFileSync(confPath));
  } catch (err) {
    return exit(err)
  }
  return file.deploy ? file.deploy : file;
}

function exit(err) {
  if (err) 
   console.log('[CLI] got error : %s', err.message || err);
  process.exit(err ? 1 : 0);
}
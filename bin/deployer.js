#!/usr/bin/env node

'use strict';

const Deployer  = require('../lib/Deployer')
const pkg       = require('../package.json')
const commander = require('commander')
const fs        = require('fs')
const path      = require('path')
const util      = require('util')

commander
  .version(pkg.version)
  .option('-s, --strategy [git]', 'set the strategy used to balance connection (default to git)', 'git')
  .option('-r, --reporter [std]', 'change reporter used to print informations (default to stdout)', 'std')
  .option('-d, --details', 'create a detailed report on the filesystem (default to false)', false)
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
        if (err) commander.details ? generateDetails(servers, exit, err) : exit(err);
        deployer.deploy(servers, (err) => {
          return commander.details ? generateDetails(servers, exit, err) : exit(err);
        })
      })
    });

commander.parse(process.argv);

function generateDetails(servers, next, err) {
  let reports = { '_CLI_GOT_' : err ? err.message || err : 'SUCCESS' };
  // only get the details
  for (let server in servers) {
    reports[server] = servers[server].reporter.details(server);
  }
  // try to write it on filesystem
  let pwd = path.join(process.env.PWD || process.cwd(), `deployer_details.json`);
  fs.writeFile(pwd, JSON.stringify(reports, null, 2), next);
}

function resolveConf(confPath) {
  let file;
  let paths = [confPath, 'package.json', 'ecosystem.json']
  for(var tmpPath of paths) {
    if (!tmpPath) continue ;

    tmpPath = path.resolve(tmpPath);
    try {
      file = JSON.parse(fs.readFileSync(tmpPath));
      break ;
    } catch (err) {
      continue ;
    }
  }
  return !file ? exit(new Error('Cant find any valid file configuration')) : (file.deploy ? file.deploy : file);
}

function exit(err) {
  if (err) 
   console.log('[CLI] ERROR : %s', err.message || err);
  process.exit(err ? 1 : 0);
}
#!/usr/bin/env node

'use strict'

const Deployer = require('../lib/Deployer')
const deployUtls = require('../lib/utils/DeployUtils')
const pkg = require('../package.json')
const commander = require('commander')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

commander
  .version(pkg.version)
  .option('-s, --strategy [git]', 'set the strategy used to balance connection (default to git)', 'git')
  .option('-r, --reporter [std]', 'change reporter used to print informations (default to stdout)', 'std')
  .option('-d, --details', 'create a detailed report on the filesystem (default to false)', false)
  .on('--help', () => {
    console.log('')
    console.log('-----> DeployerJs CLI Help')
    console.log('')
    console.log('  Commands:')
    console.log('    update     <environement|group> [file]          update remote to the latest release')
    console.log('    rollback   <environement|group> [file] [n]      revert to [n]th last deployment or 1')
    console.log('    curr[ent]  <environement|group> [file]          output current release commit')
    console.log('    prev[ious] <environement|group> [file]          output previous release commit')
    console.log('    exec <cmd> <environement|group> [file]          execute the given <cmd>')
    console.log('    list       <environement|group> [file]          list previous deploy commits')
    console.log('')
  })
commander.command('deploy <environement|group> [file]')
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
      if (err) return commander.details ? generateDetails(servers, exit, err) : exit(err)
      deployer.deploy(servers, (err) => {
        return commander.details ? generateDetails(servers, exit, err) : exit(err)
      })
    })
  })
commander.command('rollback <environement|group> [file] [n]')
  .description('rollback the code of your remote environement')
  .alias('revert')
  .action((environement, file, nbr) => {
    if (!nbr && !isNaN(file)) nbr = file

    // instanciate api
    var deployer = new Deployer(resolveConf(file), {
      strategy: commander.strategy,
      reporter: commander.reporter
    })

    // select and deploy
    deployer.select(environement, (err, servers) => {
      if (err) return commander.details ? generateDetails(servers, exit, err) : exit(err)
      deployer.rollback(servers, { rollback: nbr }, (err) => {
        return commander.details ? generateDetails(servers, exit, err) : exit(err)
      })
    })
  })
commander.command('clean <environement|group> [file]')
  .description('clean the remote enviromment and get the latest version of the code')
  .alias('clear')
  .action((environement, file) => {
    deployUtls.askUser('[CLI] Are you sure you want to proceed a clean install of remote system ? y/n ', (res) => {
      if (!res.match(/yes|y/gi)) return exit(new Error('Aborting clean install'))
      // instanciate api
      var deployer = new Deployer(resolveConf(file), {
        strategy: commander.strategy,
        reporter: commander.reporter
      })

      // select and deploy
      deployer.select(environement, (err, servers) => {
        if (err) return commander.details ? generateDetails(servers, exit, err) : exit(err)
        deployer.clean(servers, (err) => {
          return commander.details ? generateDetails(servers, exit, err) : exit(err)
        })
      })
    })
  })

commander.parse(process.argv)

function trimUnicode (string) {
  return string.replace(/\\u[a-z0-9]{4}\[([^\\]{0,3})|\\u[a-z0-9]{4}/gmi, '').replace('\b', '\n')
}

function generateDetails (servers, next, err) {
  let reports = { '_CLI_GOT_': err ? err.message || err : 'SUCCESS' }
  // only get the details
  for (let server in servers) {
    reports[server] = servers[server].reporter.details(servers[server]) || []
    reports[server].forEach((report) => {
      if (report.stdout) { report.stdout = JSON.parse(trimUnicode(JSON.stringify(report.stdout)).split('\n')) }
      if (report.stderr) {
        report.stderr = JSON.parse(trimUnicode(JSON.stringify(report.stderr)).split('\n'))
      }
    })
  }
  // try to write it on filesystem
  let pwd = path.join(process.env.PWD || process.cwd(), `deployer_details.json`)
  fs.writeFile(pwd, JSON.stringify(reports, null, 2), next)
}

function resolveConf (confPath) {
  let file
  for (var tmpPath of [confPath, 'ecosystem.json', 'package.json']) {
    if (!tmpPath) continue

    tmpPath = path.resolve(tmpPath)
    try {
      let str = fs.readFileSync(tmpPath)
      // run the file if its js or json
      if (tmpPath.match(/\.js|\.json/)) {
        file = vm.runInThisContext('(' + str + ')')
      } else {
        file = JSON.parse(str)
      }
      break
    } catch (err) {
      console.log(err)
      continue
    }
  }
  return !file ? exit(new Error('Cant find any valid file configuration')) : (file.deploy ? file.deploy : file)
}

function exit (err) {
  if (err) { console.log('[CLI] ERROR : %s', err.message || err) } else { console.log('[CLI] SUCCESS') }
  process.exit(err ? 1 : 0)
}

commander.command('*')
  .action(commander.outputHelp)

if (process.argv.length === 2) {
  commander.parse(process.argv)
  commander.outputHelp()
  process.exit(0)
}

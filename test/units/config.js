/* eslint-env mocha */
'use strict'

const chai = require('chai')
const expect = chai.expect
const Deployer = require('../../lib/Deployer')
const config = require('../../lib/utils/config')

describe('Configuration', () => {
  describe('Deployer constructor', () => {
    const sample = {
      test: {
        group: 'sample',
        username: 'notroot',
        password: 'notadmin',
        host: '127.0.0.1'
      },
      production: {
        group: 'sample',
        username: 'notroot',
        password: 'notadmin',
        host: '127.0.0.1'
      }
    }

    it('should create a Deployer instance', () => {
      let deployer = new Deployer(sample)
      expect(deployer).to.be.an.instanceof(Deployer)
    })

    it('should throw an error when no args', () => {
      let fn = function () {
        let deployer = new Deployer()
        deployer.lol()
      }
      expect(fn).to.throw(/Invalid/)
    })

    it('should have put both envs in same group', () => {
      let deployer = new Deployer(sample)
      expect(deployer.groups).to.exist
      expect(deployer.groups).to.have.all.keys(['sample'])
      expect(deployer.groups.sample).to.have.deep.property('[0].name', 'test')
      expect(deployer.groups.sample).to.have.deep.property('[1].name', 'production')
    })

    it('should set default options', () => {
      let deployer = new Deployer(sample)
      expect(deployer.strategy).to.equal(config.strategies.GIT)
      expect(deployer.reporter).to.equal(config.reporters.STD)
    })

    it('should use options when provided as string', () => {
      let deployer = new Deployer(sample, {
        reporter: 'spinner',
        strategy: 'git'
      })
      expect(deployer.strategy).to.equal(config.strategies.GIT)
      expect(deployer.reporter).to.equal(config.reporters.SPINNER)
    })

    it('should fallback to default option when invalid provided', () => {
      let deployer = new Deployer(sample, {
        reporter: 'toto',
        strategy: 'tata'
      })
      expect(deployer.strategy).to.equal(config.strategies.GIT)
      expect(deployer.reporter).to.equal(config.reporters.STD)
    })

    it('should use options when provided as function', () => {
      let deployer = new Deployer(sample, {
        reporter: config.reporters.VOID,
        strategy: config.strategies.GIT
      })
      expect(deployer.strategy).to.equal(config.strategies.GIT)
      expect(deployer.reporter).to.equal(config.reporters.VOID)
    })
  })

  describe('Selecting environnements', () => {
    let sample = {
      staging1: {
        group: 'dev',
        username: 'notroot',
        password: 'notadmin',
        host: '127.0.0.1'
      },
      prod1: {
        group: 'prod',
        username: 'notroot',
        password: true,
        host: '127.0.0.1'
      },
      staging2: {
        group: 'dev',
        username: 'notroot',
        password: 'notadmin',
        host: 'localhost'
      }
    }

    it('should select a group w/ one host per env', (done) => {
      let deployer = new Deployer(sample, { reporter: config.reporters.VOID })
      deployer.select('dev', (err, servers) => {
        expect(err).to.be.null
        expect(Object.keys(servers).length).to.be.equal(2)
        expect(servers).to.have.all.keys([sample.staging1.host, sample.staging2.host])
        return done()
      })
    })

    it('should select a group w/ multiple host per env', (done) => {
      var conf = JSON.parse(JSON.stringify(sample))
      conf.staging2.host = ['localhost:3030', 'localhost:4000']
      conf.staging1.host = ['127.0.0.1:3984', '127.0.0.1:3000']
      let deployer = new Deployer(conf, { reporter: config.reporters.VOID })
      deployer.select('dev', (err, servers) => {
        expect(err).to.be.null
        expect(Object.keys(servers).length).to.be.equal(4)
        expect(servers[conf.staging2.host[0]].name).to.equal('staging2')
        expect(servers[conf.staging2.host[1]].name).to.equal('staging2')
        expect(servers[conf.staging1.host[0]].name).to.equal('staging1')
        expect(servers[conf.staging1.host[1]].name).to.equal('staging1')
        return done()
      })
    })

    it.skip('should select env and ask for password', (done) => {
      var conf = JSON.parse(JSON.stringify(sample))
      let deployer = new Deployer(conf, { reporter: config.reporters.VOID })
      deployer.select('prod1', (err, servers) => {
        expect(err).to.be.null
        // TODO
        return done()
      })
      setTimeout(() => {
        process.stdin.write('toto\n')
        process.stdin.flush
      }, 1000)
    })
  })
})

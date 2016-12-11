
'use strict';

const chai      = require('chai');
const expect    = chai.expect;
const should    = chai.should;
const assert    = chai.assert;
const Deployer  = require('../../lib/Deployer')
const config    = require('../../lib/utils/config')


describe('Configuration', () => {

  describe('Deployer constructor', () => {

    const sample = {
      test: {
        group: 'sample',
        username: "notroot",
        password: "notadmin",
        host: "127.0.0.1"
      },
      production: { 
        group: 'sample',
        username: "notroot",
        password: "notadmin",
        host: "127.0.0.1"
      }
    }

    it('should create a Deployer instance', () => {
      let deployer = new Deployer(sample);
      expect(deployer).to.be.an.instanceof(Deployer);
    })

    it('should throw an error when no args', () => {
      let fn = function () {
        new Deployer();
      }
      expect(fn).to.throw(/Invalid/);
    })

    it('should have put both envs in same group', () => {
      let deployer = new Deployer(sample);
      expect(deployer.groups).to.exist;
      expect('sample').to.be.oneOf(Object.keys(deployer.groups));
      expect('test').to.be.oneOf(Object.keys(deployer.groups.sample));
      expect('production').to.be.oneOf(Object.keys(deployer.groups.sample));
    })

    it('should set default options', () => {
      let deployer = new Deployer(sample);
      expect(deployer.strategy).to.equal(config.strategies.GIT);
      expect(deployer.reporter).to.equal(config.reporters.STD);
    })

    it('should use options when provided as string', () => {
      let deployer = new Deployer(sample, {
        reporter: 'spinner',
        strategy: 'git'
      })
      expect(deployer.strategy).to.equal(config.strategies.GIT);
      expect(deployer.reporter).to.equal(config.reporters.SPINNER);
    })
 
    it('should fallback to default option when invalid provided', () => {
      let deployer = new Deployer(sample, {
        reporter: 'toto',
        strategy: 'tata'
      })
      expect(deployer.strategy).to.equal(config.strategies.GIT);
      expect(deployer.reporter).to.equal(config.reporters.STD);
    })

    it('should use options when provided as function', () => {
      let deployer = new Deployer(sample, {
        reporter: config.reporters.SPINNER,
        strategy: config.strategies.GIT
      });
      expect(deployer.strategy).to.equal(config.strategies.GIT);
      expect(deployer.reporter).to.equal(config.reporters.SPINNER);
    })
  })
})

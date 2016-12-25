# DeployerJS

<a href="https://github.com/feross/standard2">
  <img src="https://cdn.rawgit.com/feross/standard/master/badge.svg" alt="Standard - JavaScript Style Guide" height="25"/>
</a>
<a href="https://www.npmjs.com/package/deployerjs">
  <img src="https://img.shields.io/npm/dt/delpoyerjs.svg?style=flat-square" height="25"/>
</a>

#### Why Another Deployement Tool ?

Pure javascript, no binary needed on the local machine, forget about under-the-hood `shellscript` or `rsync`/`ssh` binary spawn. I just want to run this tool everywhere (even under windows, yes, windows) i can run NodeJS.

# How to use it ?

##### CLI Overview
```bash
deployer update        <environement|group> [file]       # update remote to latest
deployer rollback      <environement|group> [file] [n]   # revert to [n]th last
deployer currrent      <environement|group> [file]       # output current release commit
deployer previous      <environement|group> [file]       # output previous release commit
deployer execute <cmd> <environement|group> [file]       # execute the given <cmd>
deployer list          <environement|group> [file]       # list previous deployements
```

### CLI options

You can specify some options when using the CLI : 

- `-d` or `--details` when set to true, a file containing detailed logs of the deployement will be created in the current directory
- `-s [strategy]` or `--strategy [strategy]` choose the strategy used to deploy, [see below for explanation](https://github.com/vmarchaud/deployerjs#deployement-strategy)
- `-r [reporter]` or `--reporter [reporter]`  choose the reporter used to show deployement info, [see below for explanation](https://github.com/vmarchaud/deployerjs#deployment-reporter)


# Configuration

DeployerJS is based on the configuration architecture of [PM2](https://github.com/Unitech/pm2), so we represent a remote environnement like this (where `production` is the environnement name) :

```javascript
{
  "production": {
      "user": "totallynotroot",                             // ssh user
      "host": "127.0.0.1:22"                                // host adress + ssh port
      "ref": "origin/master",                               // remote branch
      "repo": "git@github.com:vmarchaud/deployerjs.git",    // git repo
      "path": "/home/totallynotroot/myprod/",               // path where the deployement will be done 
      "passphrase" : true,                                  //  if my rsa key have a passphrase
      "post-deploy": "npm install",                         // will be executed after update on remote system
      "post-deploy-local": "touch deploy.done",             // will be executed after update on local system
      "env" : {                                             // all remote hooks will be executed with this env
        "NODE_ENV": "production"
      }
  }
 }
```
To list all environnements you have two choices, put the list at the root of the JSON document (like above) or specify `deploy` object that will list them (example here with a `package.json` file) : 
```javascript
  {
  "name": "myproject",
  "version": "0.0.1",
  "scripts": {
    ...
  },
  "dependencies": {
    ...
  },
  "deploy" : {              // here you can define the environnement entries
    "staging" : { ... },    // define here your staging environnement
    "production" : { ... }  // define here you production environnement
  }
}
```

Here are the **principal options** you can set in a environnement : 

| Option key | Value Type  | Default | Example  | Description | 
| ---------: | -----------:| -------:| --------:| -----------:|
| user | String |  | root | username used to authenticate to the ssh server |
| host | String or Array |  | `['localhost:22']` or `localhost` | can contains port of the remote host, array may contains multiple hosts |
| port  | String or Number | 22 | `22` or `"22"` | port of the remote ssh server |
| password | Boolean | false | `true` or `false` | set a password to connect |
| privateKey  | String | ~/.ssh/id_rsa | a valid path on local system | use a rsa key to connect | 
| passphrase  | Boolean | false | `true` or `false` | set a passphrase to use the rsa key | 
| path  | String ||| remote path where the deployement will be done |
| group | String |  | `production` | set the group of the environnement (usefull to deploy on a group of servers)  | 
| path  | String ||| remote path where the deployement will be done |
| env  | Object || `{ "NODE_ENV": "production" }`| environnement used to execute remote hooks |
| ssh_options | Object | | `{ "agent": "myagent_path" }` | options for ssh see [ssh2 connect doc](https://github.com/mscdex/ssh2#client-methods) |

## Hooks

You can tell deployerjs to execute commands for you, we call them **hooks**, they can be run either on **remote** or **local** system, you  just need an entry in the configuration (like the above example), here are the current hooks : 
  - pre-setup & pre-setup-local
  - post-setup & post-setup-local
  - post-rollback & post-rollback-local
  - post-deploy & post-deploy-local
 

## Deployement Strategy

Deployement action (like updating/rollbacking) are done via **Strategy**, the default is the`GitStrategy` that will simply use **git** on the remote server to execute all commands necessary to deploy the code, they use **their own key/value configuration**, so i split their configuration.

Available strategies (and the corresponding CLI option to use) : 
- GitStrategy (`--strategy git`)


### GitStrategy

#### Configuration 

| Option key | Value Type  | Default | Example  | Description | 
| ---------: | -----------:| -------:| --------:| -----------:|
| ref | String | `origin/master`| any origin and branch separed by slash | Which remote and branch should be used |
| branch | String | `master` |  | branch used (override `ref`) |
| origin | String | `origin` |  | origin used (override `ref`) |
| repo | String |  | `github.com/vmarchaud/deployer` | Git repo URI |

## Deployment Reporter

To display information relative to deployement, we use a `reporter` (just a class with some methods) that will handle display of information.

By default the `StdReporter` is used, it will just print all data to STDOUT.

Available reporters (and the corresponding CLI option to use) : 
- StdReporter (`--reporter std`)
- SpinnerReporter (`--reporter spinner`)

# Architecture

Because you want to know how to fork this and start hacking it :

**soon™**

# Relevant documentation

- [ssh2](https://github.com/mscdex/ssh2) - the module used to connect over a SSH connection to the servers
- [ssh2-streams](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) - the module used by `ssh2` to implement some protocols (sftp mainly used here).

## TODO:

- More reporters
- More strategies
- Things to remember to fix : 
    - [ ] git clone without host verified

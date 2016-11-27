# DeployerJS

Yet Another Deployement Tool :
**soon™**

#### Why Another Deployement Tool ?

Pure javascript, no binary needed on the local machine, forget about under-the-hood `shellscript` or `rsync`/`ssh` binary spawn. I just want to run this tool everywhere (even under windows, yes, windows) i can run NodeJS.

# How do i run it ?
**soon™**

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
To list all environnement you have two choice, either you will have the list at the root of the JSON document (like above) or you specify `deploy` object that will list them (example here with a `package.json` file) : 
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

You can tell deployerjs to execute command for you, we call them **hooks**, they can be run either on **remote** or **local** system, you  just need an entry in the configuration (like the example above), here are the current hooks : 
  - pre-setup & pre-setup-local
  - post-setup & post-setup-local
  - post-rollback & post-rollback-local
  - post-deploy & post-deploy-local

## Deployement Strategy

Deployement action (like updating/rollbacking) are done via **Strategy**, the most used should be `GitStrategy` that will simply use **git** on the remote server to execute all commands necessary to deploy the code, they use **their own key/value configuration**, so i split their configuration.

### GitStrategy

#### Configuration 

| Option key | Value Type  | Default | Example  | Description | 
| ---------: | -----------:| -------:| --------:| -----------:|
| ref | String | `origin/master`| any origin and branch separed by slash | Which remote and branch should be used |
| branch | String | `master` |  | branch used (override `ref`) |
| origin | String | `origin` |  | origin used (override `ref`) |
| repo | String |  | `github.com/vmarchaud/deployer` | Git repo URI |

# Architecture

Because you want to know how to fork this and start hacking it :

**soon™**

# Relevent documentation

- [ssh2](https://github.com/mscdex/ssh2) - the module used to connect over a SSH connection to the servers
- [ssh2-streams](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) - the module used by `ssh2` to implement some protocols (sftp mainly used here).

## TODO:

- More reporters
- More strategies
- Things to remember to fix : 
    - [ ] git clone without host verified

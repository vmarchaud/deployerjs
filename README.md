# DeployerJS

Yet Another Deployement Tool :
**soon™**

#### Why Another Deployement Tool ?

Pure javascript, no binary needed on the local machine, forget about under-the-hood `shellscript` or `rsync`/`ssh` binary spawn. I just want to run this tool everywhere (even under windows, yes, windows) i can run NodeJS.

## How do i run it ?
**soon™**

## Configuration
**soon™**

## Architecture

Because you want to know how to fork this and start hacking it :

**soon™**

## Relevent documentation

- [ssh2](https://github.com/mscdex/ssh2) - the module used to connect over a SSH connection to the servers
- [ssh2-streams](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) - the module used by `ssh2` to implement some protocols (sftp mainly used here).

## TODO:

- More reporters
- More strategies
- Things to remember to fix : 
    - [ ] git clone without host verified
    - [ ] private key with passphrase

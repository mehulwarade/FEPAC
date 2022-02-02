# FEPAC-PHD

This code includes the FEPAC based on 3 switches used during my PHD.

## Installation

Installing dependencies for the nodeJS.
Tested connection on 'NETGEAR ProSAFE GS110TP switches'

```
npm install
```

### MySQL installation

Need MySQL server installed on local machine

# Running from scratch (Debian 10):
### RPi netboot. (location: /nfs/client/home/pi/** <= so that its accessible to other nodes =>)
`sudo apt-get update`

`sudo apt install npm`

<!-- Only if needed -->
`sudo apt install nodejs`
    `=> node -v`

`sudo apt install mariadb-server`
    `=> sudo mysql_secure_installation`


# References:

* Clearing cache (cleans all data from RAM => SLOW): https://unix.stackexchange.com/a/87909 
* MySQL Cheat Sheet: https://gist.github.com/hofmannsven/9164408
* Max file watch error (in nodemon or VSCode): https://stackoverflow.com/a/34664097 and add ignore params to `nodemonConfig` in package.json
* Markdown basics: https://wordpress.com/support/markdown-quick-reference/
* 


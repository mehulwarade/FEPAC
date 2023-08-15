# FEPAC 2.0

Source code for FEPAC 2.0 (Framework for Evaluation of Parallel Algorithms on Clusters).

Version 2.0 includes dynamic webpage for managing athom smart switches and collecting/ storing power data into the local mysql database.

This is developed as a part of my PhD research.

## Installation
`*** Tested on Debian based Linux system ***`
`*** Node Version: v18.12.1 ***`

Installing dependencies for the nodeJS.

```
npm install
```

### MySQL installation

Need MySQL server installed on local machine

```
sudo apt install mariadb-server
```
`=> sudo mysql_secure_installation`

# References:

* Clearing cache (cleans all data from RAM => SLOW): https://unix.stackexchange.com/a/87909 
* MySQL Cheat Sheet: https://gist.github.com/hofmannsven/9164408
* Max file watch error (in nodemon or VSCode): https://stackoverflow.com/a/34664097 and add ignore params to `nodemonConfig` in package.json
* Markdown basics: https://wordpress.com/support/markdown-quick-reference/
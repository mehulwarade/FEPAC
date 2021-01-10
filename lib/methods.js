const fs = require('fs');
const path = require('path');

// https://www.npmjs.com/package/clui
const CLI = require('clui');
const Spinner = CLI.Spinner;

const spin = new Spinner();

var config_path = getConfigPatha(); /* Always put this after declaring functions */
global_env = require(config_path);

module.exports = {
  getCurrentDirectoryBase: () => {
    return path.basename(process.cwd());
  },

  getConfigPath: () => {
    return getConfigPatha();
  },

  getDataFilePath: (algo_name) => {
    if(global_env.app.data_file != null){
      //For testing purposes
      return `${process.cwd()}/logs/${global_env.app.data_file}.json`;
    }
    else{
      return `${process.cwd()}/logs/${algo_name}.json`;
    }
    
  },

  directoryExists: (filePath) => {
    return fs.existsSync(filePath);
  },

  spinnerStart: (msg) => {
    spin.message(msg);
    spin.start();
  },

  spinnerStart5: (msg) => {
    spin.message(msg);
    spin.start();

    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 5000)
    })

  },

  spinnerStop: () => {
    spin.stop();
  },

  delay: (time) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), time)
    })
  }

};


function getConfigPatha() {

  return process.cwd() + '/configuration.json';

}
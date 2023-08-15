const inquirer = require("inquirer");
const functions = require("./methods");

var config_path =
  functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

// var prefix = '<== ---------------xx--------------- ==>'
var prefix = " ";
module.exports = {
  ask_main: () => {
    return inquirer.prompt({
      type: "rawlist",
      name: "res",
      prefix: prefix,
      message:
        "\nFramework for Evaluation of Parallel Algorithms on CLusters.\nPlease select your option: ",
      choices: [
        "Test MySQL connection",
        "Test SNMP connection",
        "MySQL/SNMP connection",
        "Test Athom Plug Connections",
        "Athom Plugs mysql insert",
        "Stop mysql insert",
        "Exit",
      ],
    });
  },
};

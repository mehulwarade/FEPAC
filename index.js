// Await learn https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await

const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
// const editJsonFile = require("edit-json-file");

const functions = require("./lib/methods");
const inquirer = require("./lib/inquirer");
const mysql = require("./lib/mysql");
const snmp = require("./lib/snmp");
const athom = require("./lib/athomPlugs");

var config_path =
  functions.getConfigPath(); /* Always put this after declaring functions */

var global_env;

clear();

console.log(
  chalk.yellow(figlet.textSync("FEPAC 2.0", { horizontalLayout: "full" }))
);

/* Checking for configuration file */

if (functions.directoryExists(config_path)) {
  global_env = require(config_path);
} else {
  console.log(
    chalk.red("Configuration file does not exists at " + config_path)
  );
  process.exit();
}

const run = async () => {
  try {
    const ask_main = await inquirer.ask_main();

    if (ask_main.res == "Test MySQL connection") {
      mysql.db_connect((res) => {
        run();
      });
    }  else if (ask_main.res == "Test Athom Plug Connections") {
      await athom.testConnection((res) => {
        res ? run() : process.exit;
      });
    } else if (ask_main.res == "Athom Plugs mysql insert") {
      await mysql.athomMySQL((res) => {
        run();
      });
    } else if (ask_main.res == "Stop mysql insert") {
      await mysql.end();
      console.log(chalk.blue(`Data insertion halted. Exiting!`));
      process.exit();
    } else if (ask_main.res == "Exit") {
      console.log(chalk.green("Thank you for using FEPAC 2.0"));
      process.exit();
    }
  } catch (err) {
    console.log("errrorrrroro");
    console.log(chalk.red(err));
  }
};

run();

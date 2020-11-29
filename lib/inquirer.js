const inquirer = require('inquirer');
const functions = require('./methods');

var config_path = functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

// var prefix = '<== ---------------xx--------------- ==>'
var prefix = ' '
module.exports = {
    ask_main: () => {
        return inquirer.prompt({
            type: 'rawlist',
            name: 'res',
            prefix: prefix,
            message: '\nWelcome to Framework for Evaluation of Parallel Algorithms on CLusters (FEPAC).\nPlease select your option: ',
            choices: ['Test MySQL connection', 'Test SNMP connection', 'Run FEPAC', 'Exit']
        });
    },

    ask_fepac: () => {
        return inquirer.prompt({
            type: 'rawlist',
            name: 'res',
            prefix: prefix,
            message: '\nFEPACK menu:',
            choices: ['MySQL <-> SNMP connection (Power)', 'Stop mysql insert', 'Get avg', 'Run algorithm', 'Generate graph' ,'Go Back', 'Exit']
        });
    },

    ask_run_algo: () => {
        // https://www.geeksforgeeks.org/how-to-get-the-first-key-name-of-a-javascript-object/
        var list_of_algo = Object.keys(global_env.algorithm)
        
        // https://www.w3schools.com/jsref/jsref_shift.asp
        list_of_algo.shift();   // Remove the first element
        list_of_algo.push('Go Back')
        list_of_algo.push('Exit')

        return inquirer.prompt({
            type: 'rawlist',
            name: 'res',
            prefix: prefix,
            message: '\nAlgorithm menu:',
            choices: list_of_algo
        });
    },

    confirm_run_algo: (algo_name) => {
        return inquirer.prompt({
            type: 'confirm',
            name: 'res',
            prefix: prefix,
            message: `\nDo you want to run ${algo_name} algorithm?`
        });
    }



};

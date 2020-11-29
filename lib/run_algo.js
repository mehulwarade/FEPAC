const chalk = require('chalk');

const functions = require('./methods');
const inquirer = require('./inquirer');
const mysql = require('./mysql');
const snmp = require('./snmp');
// var child = require('child_process')
const { exec, spawn, execSync } = require('child_process');

const editJsonFile = require("edit-json-file");


var config_path = functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

module.exports = {

    check: async (algorithm_name) => {

        //Checking for the algorithm details.
        await functions.spinnerStart('Checking pre-requisites for ' + algorithm_name);
        await functions.delay(1000);
        if (functions.directoryExists(global_env.algorithm[algorithm_name].file_path) && functions.directoryExists(global_env.algorithm.hostfile_folder) && functions.directoryExists(functions.getDataFilePath(algorithm_name))) {
            console.log(chalk.green('\nAlgorithm, hostfiles and log files exists'))
            await functions.spinnerStop();

            if ((await inquirer.confirm_run_algo(algorithm_name)).res) {

                // run_algo([1,3,33,3,3,3,3,3,3])
                await run_algo(global_env.app.start_node, global_env.app.start_thread, algorithm_name, global_env.app.max_nodes, global_env.app.max_threads, res => {
                    // console.log('PPPPP:'+res)
                })

                // await final_run_algo(algorithm_name, res => {
                //     if (res) {
                //         return true;
                //     }
                // });

            }
            else {
                console.log(chalk.red('\nAlgorithm execution not authorised.'))
                return false;
            }
        }
        else {
            console.log(chalk.red('\nAlgorithm, hostfiles or log file not found. Check configuration file'))
            await functions.spinnerStop();
            return false;
        }
        // https://stackoverflow.com/a/54222450
        // console.log(ask_run_algo.res);
        // console.log(global_env.algorithm[ask_run_algo.res]);
    }

};





function run_algo(node, thread, algorithm_name, max_nodes, max_threads, callback) {

    node = node || 1;

    if (node == 1) {
        thread = thread || 2;
    }
    else {
        thread = thread || 1;
    }

    if (thread > max_threads) {
        run_algo(node + 1, null, algorithm_name, max_nodes, max_threads)
    }
    else if (node > max_nodes) {
        return
    }
    else {
        
        iterate(node, thread, algorithm_name, callback => {
            if (callback) {
                console.log(chalk.green(' Updated json file!'))
            }
            else {
                console.log(chalk.red('Algorithm did not finish successfully'));
                process.exit();
            }

            functions.spinnerStop();

            if (node == max_nodes && thread == max_threads) {
                console.log("completed");
                return;
            } else {
                run_algo(node, thread + 1, algorithm_name, max_nodes, max_threads)
            }
        });
    }
}

async function iterate(node, thread, algorithm_name, callback) {

    let data_file = editJsonFile(functions.getDataFilePath(algorithm_name), {
        autosave: true
    });

    var w = await functions.spinnerStart5(chalk.yellow(`Sleeping for 5sec and Running algorithm : ${algorithm_name} on Node: ${node} Thread: ${thread}`));
    var stval = new Date().getTime()
    var mpirun = `mpirun -N ${thread} -hostfile ${global_env.algorithm.hostfile_folder}/hostfile${node} ${global_env.algorithm[algorithm_name].command}`

    // TEST
    var exec_run = `ssh ${global_env.app.master_node_ip} 'cd ${global_env.app.folder_location_on_nodes} && ${mpirun}'`
    var a = `ssh ${global_env.app.master_node_ip} 'echo Node: ${node} Thread: ${thread}'`
    var pythontest = `ssh ${global_env.app.master_node_ip} 'cd mpi && mpirun -np 2 python3 helloworld.py'`
    // console.log(a)

    var child = await exec(exec_run)

    //https://nodejs.org/api/child_process.html 
    // The output from the file should be just one. more than one output will run concurrent processes.
    child.stdout.on('data', (data) => {
        // console.log(data);
        data_file.set(`${node}.${thread}`, {
            "timestamp": {
                "start": stval,
                "end": new Date().getTime(),
                "output": data
            }
        });
        
        return callback(true)

    });

    child.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        return callback(false)
    });

    child.on('close', (code) => {
        // console.log(`child process exited with code ${code}`);
        // console.log(data);

        if(!global_env.algorithm[algorithm_name].is_output){
            //if given that there is no output
            data_file.set(`${node}.${thread}`, {
                "timestamp": {
                    "start": stval,
                    "end": new Date().getTime(),
                    "output": " "
                }
            });
            
            return callback(true)
        }
    });
}
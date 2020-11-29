// Await learn https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await 


const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
// const editJsonFile = require("edit-json-file");

const functions = require('./lib/methods');
const inquirer = require('./lib/inquirer');
const mysql = require('./lib/mysql');
const snmp = require('./lib/snmp');
const running_algo = require('./lib/run_algo');
const graph = require('./lib/graph');

var config_path = functions.getConfigPath(); /* Always put this after declaring functions */

clear();

console.log(
    chalk.yellow(
        figlet.textSync('FEPAC', { horizontalLayout: 'full' })
    )
);

/* Checking for configuration file */

if (functions.directoryExists(config_path)) {
    // console.log(chalk.green('Configuration file found.'));
    var global_env = require(config_path);
    // var datajson = require(process.cwd() + '/logs/data.json');
    // let data_file = editJsonFile('logs/data.json', {
    //     autosave: true
    // });

    // for(node=1;node<=6;node++){
    //     for(thread=1;thread<=12;thread++){
    //         data_file.set(`${global_env.db.table_name}.${node}.${thread}`, {
    //             "timestamp": {
    //                 "start": "",
    //                 "end": ""
    //             }
    //         });
    //     }
    // }
    // console.log('end')
    // console.log(datajson.cl_480_2_node_full.p1.timestamp);
    // // https://stackoverflow.com/a/54222450
    // console.log(datajson[global_env.db.table_name].p1.timestamp);
}
else {
    console.log(chalk.red('Configuration file does not exists at ' + config_path));
    process.exit();
}


const run = async () => {
    try {
        
        const ask_main = await inquirer.ask_main();

        if (ask_main.res == 'Test MySQL connection') {
                mysql.db_connect((res) => {
                    run();
                });
        }
        else if (ask_main.res == 'Test SNMP connection') {
                snmp.snmp_connect((res) => {
                    run();
                });
        }
        else if (ask_main.res == 'Run FEPAC') {
            fepac();
        }
        else if(ask_main.res == 'Exit'){
            console.log(chalk.green('Thank you for using FEPAC'))
            process.exit();
        }
        // console.log(chalk.green('All done!'));
    }

    catch (err) {
        console.log('errrorrrroro');
        console.log(chalk.red(err));
    }
};


const fepac = async () => {

    const ask_fepac = await inquirer.ask_fepac();
            
    if (ask_fepac.res == 'MySQL <-> snmp connection (Power)') {
        await mysql.snmp('test',(res) => {
            fepac()
        });
        console.log(chalk.blue(`TABLE [test]: Data being inserted.`))
        fepac()
    }
    else if (ask_fepac.res == 'Stop mysql insert') {
        await snmp.stop_snmp();
        console.log(chalk.blue(`Data insertion halted. Exiting!`))
        process.exit();
    }
    else if (ask_fepac.res == 'Get avg') {
        get_avg();
    }
    else if (ask_fepac.res == 'Run algorithm') {
        algo_run(); 
    }
    else if (ask_fepac.res == 'Generate graph') {
        const algo_list = await inquirer.ask_run_algo();

        if (algo_list.res == 'Go Back') {
            fepac();
        }
        else if(algo_list.res == 'Exit'){
            console.log(chalk.green('Thank you for using FEPAC'))
            process.exit();
        }
        else{
            try {
                await graph.generate_graph(algo_list.res,(res) => {
                    console.log(res);
                });
            }
            catch (err) {
                console.log('errro');
                console.log(chalk.red(err));
            }
        }
    }
    else if (ask_fepac.res == 'Go Back') {
        run();
    }
    else if(ask_fepac.res == 'Exit'){
        console.log(chalk.green('Thank you for using FEPAC'))
        process.exit();
    }
    


};

const algo_run = async () => {
    const ask_run_algo = await inquirer.ask_run_algo();

    if (ask_run_algo.res == 'Go Back') {
        fepac();
    }
    else if(ask_run_algo.res == 'Exit'){
        console.log(chalk.green('Thank you for using FEPAC'))
        process.exit();
    }
    else{
        try {
            await mysql.snmp(ask_run_algo.res,(res) => {
            });
            console.log(chalk.blue(`TABLE [${ask_run_algo.res}]: Data being inserted.`))

            if (await running_algo.check(ask_run_algo.res)) {
                console.log(chalk.green(`${ask_run_algo.res} algorithm finished with no errors.`))
                console.log(chalk.green('Thank you for using FEPAC'))
                process.exit();
                
            }
            else{
                // If checking details returns => not found then run again
                algo_run();
            }
        }
        catch (err) {
            console.log('errrorrrroro');
            console.log(chalk.red(err));
        }
    }
}

const get_avg = async () => {
    const ask_algo_for_avg = await inquirer.ask_run_algo();

    if (ask_algo_for_avg.res == 'Go Back') {
        fepac();
    }
    else if(ask_algo_for_avg.res == 'Exit'){
        console.log(chalk.green('Thank you for using FEPAC'))
        process.exit();
    }
    else{
        try {
            
            // mysql.fill_avg_data(algorithm_name);
            await mysql.fill_avg_data(ask_algo_for_avg.res);

        }
        catch (err) {
            console.log('errrorrrroro');
            console.log(chalk.red(err));
        }
    }
}

// algo_run();
run();

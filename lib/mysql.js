const functions = require('./methods');
const snmp = require('./snmp');

const editJsonFile = require("edit-json-file");

const chalk = require('chalk');

var config_path = functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

/* MySQL initialization

Authentication error:
Run Mysql in command prompt (sudo mysql)
In Mysql query do following (be sure to use password set while setup and root user):

mysql(MAC)-> ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Password';
MariaDB(RPi)-> ALTER USER 'root'@'localhost' IDENTIFIED BY 'Password';
mysql-> FLUSH PRIVILEGES;

https://stackoverflow.com/a/51918364

mysql terminal commands:

//To show the output without the fancy lining:
https://stackoverflow.com/a/9558954 

//All mysql queries:
https://gist.github.com/hofmannsven/9164408

//Some mysql command (terminal)
mysql -u [USER] -p [DATABASE_NAME] -ss -e "select * from [TABLE_NAME]"
mysql -u [USER] -p [DATABASE_NAME] -ss -e "select [COLUMN_NAME] from [TABLE_NAME] where [COLUMN_NAME] between [VALUES] and [VALUES]"
mysql -u [USER] -p [DATABASE_NAME] -e "select * from [TABLE_NAME] where [COLUMN_NAME] between [VALUES] and [VALUES]"
mysql -u [USER] -p [DATABASE_NAME] -e "select * from [TABLE_NAME]"

mysql -u root -p mytestdb -ss -e "select * from test_single_power"
mysql -u root -p mytestdb -ss -e "select p1 from test_single_power where timestamp between 1596269829953 and 1596270105047"
mysql -u root -p mytestdb -e "select * from test_single_power where timestamp between 1596269240632 and 1596269402026"
mysql -u root -p mytestdb -e "select * from test_single_power"

RENAME TABLE old_table TO new_table;
*/
const mysql = require('mysql');
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');

sql = mysql.createConnection({
    host: global_env.db.host,
    user: global_env.db.user,
    password: global_env.db.password,
    multipleStatements: true
});


module.exports = {
    db_connect: async (callback) => {
        await functions.spinnerStart('Testing connection to mysql server...');

        /* This following is to simulate 1 second delay to show the spinner */
        /* return sql   <- Also works */
        /* Callback info: https://stackoverflow.com/a/23340273 */
        /*Callback for mysql:npm https://www.npmjs.com/package/mysql */
        await functions.delay(1000);

        await sql.connect(async (err) => {
            if (err) {
                console.log(chalk.red('Connection to Mysql server failed.'));
                functions.spinnerStop();
                console.log(chalk.red('Stop all services and try again. The program will end.'));
                await functions.delay(500);
                process.exit();
            }
            else {
                console.log(chalk.green('MySQL connection successfull!'));
                functions.spinnerStop();
                return callback(true);
            }
        });
    },

    snmp: async (tb_name, callback) => {

        await check_db(global_env.db.db_name);
        await change_working_db(global_env.db.db_name);
        await check_table(tb_name);
        await insert_description(tb_name, 'Start');

        await snmp.power_data(async (res) => {
            
            // console.log(res);
            
            var qinsertpwr = `INSERT INTO ${tb_name} (timestamp, description, p1, p2, p3, p4, p5, p6, p7) VALUES (${Date.now()},' ', ${res[1]} , ${res[2]} , ${res[3]} , ${res[4]} , ${res[5]} , ${res[6]} , ${res[7]})`;
            // console.log(qinsertpwr);

            await sql.query(qinsertpwr, (err) => {
                if (err) {
                    console.log(chalk.red('Inserting into the table halted'));
                    // process.exit();
                    return callback(false);
                } else {
                    // console.log(chalk.green("Inserted successfully : Power"));
                }
            });

        });
    },

    fill_avg_data: async (algo_name, callback) => {
        await get_average(algo_name, null, null, global_env.app.max_nodes, global_env.app.max_threads);
    }
};

async function check_db(db_name) {
    //Checking databases
    await sql.query("CREATE DATABASE if not exists " + db_name, (err) => {
        if (err) {
            // console.log(chalk.blue(db_name + " : Error or database already exists. Continuing..."));
        } else {
            // console.log(chalk.green(db_name + " : Database created."));
        }
    });
}

async function change_working_db(db_name) {

    //Changing to current database
    await sql.query('use ' + db_name, (err) => {
        if (err) {
            console.log(chalk.red("Error while changing databases."));
            process.exit();
        } else {
            // console.log(chalk.green("Working Database changed to " + db_name));
        }
    });

}

async function check_table(tb_name) {

    //Check or create table
    var q = `CREATE TABLE if not exists ${tb_name} (timestamp BIGINT(255), description VARCHAR(255), p1 FLOAT(12), p2 FLOAT(12), p3 FLOAT(12), p4 FLOAT(12), p5 FLOAT(12), p6 FLOAT(12), p7 FLOAT(12))`;
    await sql.query(q, (err) => {
        if (err) {
            // console.log(chalk.blue(tb_name + 'Error or table already exists. Continuing...'));
        } else {
            // console.log(chalk.green(tb_name + " : Table created."));
        }
    });

}

async function insert_description(tb_name, description) {

    var qinsertpwr = `INSERT INTO ${tb_name} (timestamp, description) VALUES ( ${Date.now()} ,'${description}')`;
    // console.log(qinsertpwr);

    await sql.query(qinsertpwr, (err) => {
        if (err) {
            // console.log(chalk.red('INIT: Error inserting into the table'));
        } else {
            // console.log(chalk.green("INIT: Inserted successfully : Power"));
        }
    });

}

async function get_average(algo_name, node, thread, max_nodes, max_threads, callback) {

    data_json_file = require(functions.getDataFilePath(algo_name));

    await change_working_db(global_env.db.db_name);

    node = node || 1;

    if (node == 1) {
        thread = thread || 2;
    }
    else {
        thread = thread || 1;
    }

    if (thread > max_threads) {
        get_average(algo_name, node + 1, null, max_nodes, max_threads)
    }
    else if (node > max_nodes) {
        console.log(chalk.green("Avg successfull"));
        process.exit();
    }
    else if (data_json_file[node] == null) {
        console.log(chalk.green("Avg successfull"));
        process.exit();
    }
    else {
        if (data_json_file[node][thread].timestamp.start != '' && data_json_file[node][thread].timestamp.end != '') {
            // console.log(data_json_file[node][thread].timestamp);

            avg_val(node, thread, algo_name, data_json_file[node][thread].timestamp.start, data_json_file[node][thread].timestamp.end, callback => {
                if (callback) {
                    console.log(chalk.green(' Updated json file!'))
                }
                else {
                    console.log(chalk.red('Algorithm did not finish successfully'));
                    process.exit();
                }

                if (node == max_nodes && thread == max_threads) {
                    console.log("completed");
                    console.log(chalk.green("Avg successfull"));
                    process.exit();
                } else {
                    get_average(algo_name, node, thread + 1, max_nodes, max_threads)
                }
            })

        }
        else {
            console.log('no data found');
            if (node == max_nodes && thread == max_threads) {
                console.log(chalk.green("Avg successfull"));
                process.exit();
            } else {
                get_average(algo_name, node, thread + 1, max_nodes, max_threads)
            }
        }
    }
}

async function avg_val(node, thread, algo_name, st, ed, callback) {


    let data_file = editJsonFile(functions.getDataFilePath(algo_name), {
        autosave: true
    });

    var p = []
    // console.log(data_file);
    var qavgpwr1 = `SELECT avg(p1) as p1 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr2 = `SELECT avg(p2) as p2 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr3 = `SELECT avg(p3) as p3 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr4 = `SELECT avg(p4) as p4 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr5 = `SELECT avg(p5) as p5 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr6 = `SELECT avg(p6) as p6 from ${algo_name} where timestamp between ${st} and ${ed}`;
    var qavgpwr7 = `SELECT avg(p7) as p7 from ${algo_name} where timestamp between ${st} and ${ed}`;
    // console.log(qavgpwr1);

    await sql.query(`${qavgpwr1};${qavgpwr2};${qavgpwr3};${qavgpwr4};${qavgpwr5};${qavgpwr6};${qavgpwr7}`, async (err, results, fields) => {
        if (err) {
            console.log(err);
            console.log(chalk.red('Avg fail'));
            return callback(false)
        } else {
            p[1] = results[0][0].p1
            p[2] = results[1][0].p2
            p[3] = results[2][0].p3
            p[4] = results[3][0].p4
            p[5] = results[4][0].p5
            p[6] = results[5][0].p6
            p[7] = results[6][0].p7

            // console.log(p);

            // console.log(`J: ${node} K: ${thread}\n`);
            // console.log(ed - st);
            // console.log(p[1]);
            // console.log(p[2]);
            // console.log(p[3]);
            // console.log(p[4]);
            // console.log(p[5]);
            // console.log(p[6]);
            // console.log(p[7]);

            switch (node) {
                case 1:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: 0,
                        p3: 0,
                        p4: 0,
                        p5: 0,
                        p6: 0,
                        p7: 0
                    });
                    break;
                case 2:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: 0,
                        p4: 0,
                        p5: 0,
                        p6: 0,
                        p7: 0
                    });
                    break;
                case 3:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: p[3],
                        p4: 0,
                        p5: 0,
                        p6: 0,
                        p7: 0
                    });
                    break;
                case 4:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: p[3],
                        p4: p[4],
                        p5: 0,
                        p6: 0,
                        p7: 0
                    });
                    break;
                case 5:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: p[3],
                        p4: p[4],
                        p5: p[5],
                        p6: 0,
                        p7: 0
                    });
                    break;
                case 6:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: p[3],
                        p4: p[4],
                        p5: p[5],
                        p6: p[6],
                        p7: 0
                    });
                    break;
                case 7:
                    data_file.set(`${node}.${thread}.pwr_avg`, {
                        p1: p[1],
                        p2: p[2],
                        p3: p[3],
                        p4: p[4],
                        p5: p[5],
                        p6: p[6],
                        p7: p[7]
                    });
                    break;
            }
            return callback(true)
            // functions.delay(500);

            // console.log('PPPPP:' + p)
            // console.log(chalk.green("Avg successfull"));
        }

    })
}
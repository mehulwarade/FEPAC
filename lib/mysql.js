const functions = require("./methods");
const snmp = require("./snmp");

const chalk = require("chalk");

var config_path =
  functions.getConfigPath(); /* Always put this after declaring functions */
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

mysql -u root -pqaz rpi4 -ss -e "select * from montage_1_5d_6n_4t where timestamp between 1613415828 and 1613432749"


RENAME TABLE old_table TO new_table;
*/

/*

MAC Mysql Password reset [use when "mysql -u root -p" does not work or you don't remember the password]:
REF: https://gist.github.com/zubaer-ahammed/c81c9a0e37adc1cb9a6cdc61c4190f52  

Turn off mysql server:
sudo /usr/local/mysql/support-files/mysql.server stop

CHECK STATUS: sudo /usr/local/mysql/support-files/mysql.server status

cd /usr/local/mysql/bin
sudo ./mysqld_safe --skip-grant-tables

open new window and 

mysql -u root
UPDATE mysql.user SET authentication_string=null WHERE User='root';
FLUSH PRIVILEGES;
exit;

mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'qaz';


STOP THE MYSQL SAFE MODE BY: sudo /usr/local/mysql/support-files/mysql.server stop

RUN NORMAL SERVER: sudo /usr/local/mysql/support-files/mysql.server start

you should be able to access the mysql

import the databases using: mysql -uroot -pqaz rpi4 < dbexport.sql

*/

const mysql = require("mysql");
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require("constants");

sql = mysql.createConnection({
  host: global_env.db.host,
  user: global_env.db.user,
  password: global_env.db.password,
  multipleStatements: true,
});

module.exports = {
  db_connect: async (callback) => {
    await functions.spinnerStart("Testing connection to mysql server...");

    /* This following is to simulate 1 second delay to show the spinner */
    /* return sql   <- Also works */
    /* Callback info: https://stackoverflow.com/a/23340273 */
    /*Callback for mysql:npm https://www.npmjs.com/package/mysql */
    await functions.delay(1000);

    await sql.connect(async (err) => {
      if (err) {
        console.log(chalk.red("Connection to Mysql server failed."));
        functions.spinnerStop();
        console.log(
          chalk.red("Stop all services and try again. The program will end.")
        );
        await functions.delay(500);
        process.exit();
      } else {
        console.log(chalk.green("MySQL connection successfull!"));
        functions.spinnerStop();
        return callback(true);
      }
    });
  },

  snmp: async (callback) => {
    await check_db(global_env.db.db_name);
    await change_working_db(global_env.db.db_name);
    await check_table(global_env.db.table_name);
    await insert_description(global_env.db.table_name, "Start");

    await snmp.power_data(async (res) => {
    //   console.log(res);

      var qinsertpwr = `INSERT INTO ${
        global_env.db.table_name
      } (timestamp, description, p1, p2, p3, p4, p5, p6, p7, p8, p9 ,p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24) VALUES (${
        Date.now() / 1000
      },' ', ${res[1] ? res[1] : 0} , ${res[2] ? res[2] : 0} , ${
        res[3] ? res[3] : 0
      } , ${res[4] ? res[4] : 0} , ${res[5] ? res[5] : 0} , ${
        res[6] ? res[6] : 0
      } , ${res[7] ? res[7] : 0}, ${res[8] ? res[8] : 0}, ${
        res[9] ? res[9] : 0
      } , ${res[10] ? res[10] : 0} , ${res[11] ? res[11] : 0} , ${
        res[12] ? res[12] : 0
      } , ${res[13] ? res[13] : 0} , ${res[14] ? res[14] : 0} , ${
        res[15] ? res[15] : 0
      } , ${res[16] ? res[16] : 0} , ${res[17] ? res[17] : 0}, ${
        res[18] ? res[18] : 0
      }, ${res[19] ? res[19] : 0} , ${res[20] ? res[20] : 0} , ${
        res[21] ? res[21] : 0
      } , ${res[22] ? res[22] : 0} , ${res[23] ? res[23] : 0}, ${
        res[24] ? res[24] : 0
      })`;
      // console.log(qinsertpwr);

      await sql.query(qinsertpwr, (err) => {
        if (err) {
          console.log(chalk.red("Inserting into the table halted"));
          // process.exit();
          return callback(false);
        } else {
          // console.log(chalk.green("Inserted successfully : Power"));
        }
      });
    });
  },

  end: async (callback) => {
    await check_db(global_env.db.db_name);
    await change_working_db(global_env.db.db_name);
    await check_table(global_env.db.table_name);
    await insert_description(global_env.db.table_name, "End");
  },
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
  await sql.query("use " + db_name, (err) => {
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
  var q = `CREATE TABLE if not exists ${global_env.db.table_name} (timestamp BIGINT(255), description VARCHAR(255), p1 FLOAT(12), p2 FLOAT(12), p3 FLOAT(12), p4 FLOAT(12), p5 FLOAT(12), p6 FLOAT(12), p7 FLOAT(12), p8 FLOAT(12), p9 FLOAT(12), p10 FLOAT(12), p11 FLOAT(12), p12 FLOAT(12), p13 FLOAT(12), p14 FLOAT(12), p15 FLOAT(12), p16 FLOAT(12), p17 FLOAT(12), p18 FLOAT(12), p19 FLOAT(12), p20 FLOAT(12), p21 FLOAT(12), p22 FLOAT(12), p23 FLOAT(12), p24 FLOAT(12))`;
  await sql.query(q, (err) => {
    if (err) {
      // console.log(chalk.blue(tb_name + 'Error or table already exists. Continuing...'));
    } else {
      // console.log(chalk.green(tb_name + " : Table created."));
    }
  });
}

async function insert_description(tb_name, description) {
  var qinsertpwr = `INSERT INTO ${tb_name} (timestamp, description) VALUES ( ${
    Date.now() / 1000
  } ,'${description}')`;
  // console.log(qinsertpwr);

  await sql.query(qinsertpwr, (err) => {
    if (err) {
      // console.log(chalk.red('INIT: Error inserting into the table'));
    } else {
      // console.log(chalk.green("INIT: Inserted successfully : Power"));
    }
  });
}

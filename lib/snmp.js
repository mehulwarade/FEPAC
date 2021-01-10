const functions = require('./methods');
const chalk = require('chalk');

var config_path = functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

//SNMP initialisation
var snmp = require ("net-snmp");

var session = snmp.createSession (global_env.switch.IP,'public')

// OIDs
systemDescription = '1.3.6.1.2.1.1.1.0'
// systemuptime='1.3.6.1.2.1.1.3.0'
// getipaddr='1.3.6.1.2.1.4.20.1.1.'+ip
port1='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.1'
port2='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.2'
port3='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.3'
port4='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.4'
port5='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.5'
port6='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.6'
port7='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.7'
port8='1.3.6.1.4.1.4526.11.15.1.1.1.2.1.8'

var name = ['System Name','port1','port2','port3','port4','port5','port6','port7','port8']
var oids = [systemDescription,port1,port2,port3,port4,port5,port6,port7,port8]
 
var pwr = [];
var timerId;

module.exports = {
    snmp_connect: async (callback) => {

        await functions.spinnerStart('Testing connection to SNMP server...');

        /* This following is to simulate 1 second delay to show the spinner */
        /* Callback info: https://stackoverflow.com/a/23340273 */
        await functions.delay(1000);

        await session.get(['1.3.6.1.2.1.1.1.0'], async function (error, varbinds) {
            if (error) {
                console.log(chalk.red('Connection to SNMP server failed.'));
                functions.spinnerStop();
                console.log(chalk.red('Stop all services and try again. The program will end.'));
                await functions.delay(500);
                process.exit();
            } else {
                console.log(chalk.green('Connection Successfull!'));
                functions.spinnerStop();
                session.close ();
                return callback(true);
            }
        });
    },

    power_data: async (callback) => {
        
        setInterval(() => {
            session.get(oids, function (error, varbinds) {
                if (error) {
                    console.log('Connection to SNMP server failed while quering for values.');
                }
                else {
                    pwr[0] = String(varbinds[0].value);
                    pwr[1] = parseFloat(varbinds[1].value) / 1000;
                    pwr[2] = parseFloat(varbinds[2].value) / 1000;
                    pwr[3] = parseFloat(varbinds[3].value) / 1000;
                    pwr[4] = parseFloat(varbinds[4].value) / 1000;
                    pwr[5] = parseFloat(varbinds[5].value) / 1000;
                    pwr[6] = parseFloat(varbinds[6].value) / 1000;
                    pwr[7] = parseFloat(varbinds[7].value) / 1000;
        
                    // console.log(pwr);
                    return callback(pwr);
                }
            })
        }, parseInt(global_env.switch.interval_to_call))
    },

    stop_snmp: () => {
        //if timerID is null then don't do anything
        clearInterval(timerId);
    }
};









const functions = require("./methods");
const chalk = require("chalk");
var config_path =
  functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);
var ping = require("ping"); /* https://www.npmjs.com/package/ping */
var curl = require("curl");

var pwr = [];

module.exports = {
  testConnection: async (callback) => {
    await functions.spinnerStart("Testing connection to Smart Plugs...");

    /* This following is to simulate 1 second delay to show the spinner */
    /* Callback info: https://stackoverflow.com/a/23340273 */
    await functions.delay(1000);

    await global_env.smartPlug.allIP.forEach(async (host) => {
      await ping.sys.probe(host, (isAlive) => {
        var msg = isAlive
          ? chalk.green("host " + host + " is alive")
          : chalk.red("host " + host + " is dead");
        console.log(msg);
      });
    });
    await functions.delay(5000);
    functions.spinnerStop();
    callback(true);
  },

  power_data: async (callback) => {
    setInterval(() => {
      // var url = `http://${global_env.smartPlug.masterIP}/sensor/athom_smart_plug_v2_power`;
      // var options = "";
      // curl.get(url, options, function (err, response, body) {
      //   console.log(JSON.parse(body).value);
      // });

      const getCurl = async (i) => {
        var url = `http://${global_env.smartPlug.allIP[i]}/sensor/athom_smart_plug_v2_power`;
        var options = "";

        await curl.get(url, options, async (err, response, body) => {
          if (err) {
            // console.log(err);
            return;
          }
          // console.log(body);
          // await console.log(JSON.parse(body).value);
          pwr[i + 1] = await JSON.parse(body).value;
        });
      };

      for (i = 0; i < global_env.smartPlug.allIP.length; i++) {
        // console.log(i);
        getCurl(i);
      }
      return callback(pwr);
    }, parseInt(global_env.smartPlug.interval_to_call));
  },
};

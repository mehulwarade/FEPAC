const fs = require('fs');
const path = require('path');
const functions = require('./methods');

// https://www.npmjs.com/package/clui
const CLI = require('clui');
const chalk = require('chalk');
const Spinner = CLI.Spinner;

const spin = new Spinner();

var config_path = functions.getConfigPath(); /* Always put this after declaring functions */
global_env = require(config_path);

//https://plotly.com/nodejs/multiple-axes/
const plotly = require('plotly')(global_env.plotly.uname, global_env.plotly.api);

module.exports = {

  generate_graph: async (algo_name, callback) => {
    await functions.spinnerStart('Generating graph for ' + algo_name);

    if (functions.directoryExists(functions.getDataFilePath(algo_name))) {
      //CHECKING FOR EXISTENCE OF DATA FILE
      // file found and importing it

      data_file = require(functions.getDataFilePath(algo_name));

      var x_axis = []
      var watt_hr = []
      var time = []
      var output = []
      z = 0;


      try {
        for (node = 1; node <= global_env.app.max_nodes; node++) {
          for (thread = 1; thread <= global_env.app.max_threads; thread++) {
            if (node == 1 && thread == 1) {
              //do nothing for thread 1
            }
            else {
              x_axis[z] = `node:${node} thread:${thread}`;
              // console.log(`node:${node} thread:${thread}`);
              var delta = (data_file[node][thread].timestamp.end - data_file[node][thread].timestamp.start) / 1000;
  
              var pwr = data_file[node][thread].pwr_avg;
  
              var totalpwr = pwr.p1 + pwr.p2 + pwr.p3 + pwr.p4 + pwr.p5 + pwr.p6 + pwr.p7;
              // console.log(totalpwr);
  
              time[z] = delta;
              watt_hr[z] = (delta / 3600) * totalpwr;
              // for matrix multiplication
              // watt_hr[z] = (data_file[node][thread].timestamp.output / 3600) * totalpwr;

              if(global_env.algorithm[algo_name].is_output){
                output[z] = data_file[node][thread].timestamp.output
              }
              z++;
            }
          }
          // console.log(time);
          // console.log(watt_hr);
          // process.exit();
        }
      }
      catch (err) {
        console.log(chalk.red('Error: Graph could not be generated fully. Check and debug.'));
        //if typeerror check if the data file has the corresponding values
        // console.log(chalk.red(err));
      }

      // console.log(x_axis);

      //artificially delay for for loop to end
      await functions.delay(500);

      var watthr = {
        x: x_axis,
        y: watt_hr,
        name: "watt-hr",
        type: "scatter"
      };
      var timea = {
        x: x_axis,
        y: time,
        name: "total_time",
        yaxis: "y2",
        type: "scatter"
      };
      var com_timea = {
        x: x_axis,
        y: output,
        name: "algorithm_output",
        yaxis: "y2",
        type: "scatter"
      };
      var data = [watthr, timea, com_timea];
      var layout = {
        title: algo_name,
        yaxis: { title: "Energy consumption (Wh)" },
        yaxis2: {
          title: "Time (sec)",
          // title: "milliseconds",
          overlaying: "y",
          side: "right"
        }
      };

      var graphOptions = { layout: layout, filename: algo_name, fileopt: "overwrite" };

      plotly.plot(data, graphOptions, async function (err, msg) {
        if (err) return console.log(err);
        await console.log(chalk.magenta('\nThe graph is available at: ', chalk.underline.yellow(msg.url)));
        await functions.spinnerStop();
      });

    }
    else {
      console.log(chalk.red('\nLog file not found. Check configuration file'))
      await functions.spinnerStop();
      return false;
    }



    // return callback(algo_name);
  }

};

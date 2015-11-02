/**
 * @file
 * Execute post-build commands on Aquifer projects.
 */

/* globals require, Aquifer, AquiferRunConfig, module */

module.exports = function(Aquifer, AquiferRunConfig) {

  'use strict';

  var AquiferRun  = function() {},
      spawn           = require('child_process').spawn,
      _               = require('lodash');

  /**
   * Informs Aquifer of what this extension does.
   *
   * @returns {object} Details about this deployment script.
   */
  AquiferRun.commands = function () {
    return {
      'run': {
        description: 'Executes post-build commands defined in aquifer.json, such as apply database updates, clear cache, and so forth.',
        options: {
          profile: {
            name: '-p --profile <profile>',
            description: 'Optionally specify the run profile. This can be used to run a different set of commands against different environments.'
          }
        }
      }
    };
  };

  /**
   * Run when user runs commands within this extension.
   *
   * @param {string} command - Command string representing the name of the command defined in AquiferRun.commands that should run.
   * @param {object} commandOptions - Options options passed from the command.
   * @param {function} callback - Callback function that is called when there is an error message to send.
   *
   * @returns {undefined} null.
   */
  AquiferRun.run = function (command, commandOptions, callback) {
    var functions = [],
        options   = {},
        profile;

    // Only act on run command.
    if (command !== 'run') {
      callback('Invalid command.');
      return;
    }

    // Merge all options together.
    _.assign(options, AquiferRunConfig, commandOptions, function (lastValue, nextValue, name) {
      return nextValue ? nextValue : lastValue;
    });

    // Check for a specified profile.
    if (!options.profile && !options.defaultProfile) {
      callback('No profile was specified and no default profile exists.');
      return;
    }

    // Determine which profile to use.
    if (options.profile) {
      if (!options.profiles[options.profile]) {
        callback('No "' + options.profile + '" profile exists.');
        return;
      }
      profile = options.profiles[options.profile];
    }
    else {
      if (!options.profiles[options.defaultProfile]) {
        callback('The default profile is set to "' + options.defaultProfile + '", but that profile does not exist.');
        return;
      }
      profile = options.profiles[options.defaultProfile];
    }

    profile.commands.forEach(function (command) {
      functions.push(function () {
        return new Promise(function (resolve, reject) {
          var spawnOptions  = {},
              origCommand   = command,
              child;

          if (profile.ssh) {
            // Set command to ssh.
            command = {
              name: 'ssh',
              args: ['-q', '-tt', profile.ssh.user + '@' + profile.ssh.host]
            };

            // Append the original command in the specified remote directory.
            command.args.push('cd ' + profile.ssh.root + ' && ' + origCommand.name + ' ' + origCommand.args.join(' '));
          }
          else {
            spawnOptions.cwd = Aquifer.project.config.paths.build;
          }

          child = spawn(command.name, command.args, spawnOptions);

          child.stdout.on('data', function (data) {
            console.log(data.toString('utf8').trim());
          });
          child.stderr.on('data', function (data) {
            console.log(data.toString('utf8').trim());
          });
          child.on('close', function (code) {
            if (code !== 0) {
              return reject(command.name + 'command exited with code ' + code);
            }
            resolve();
          });
        });
      });
    });


    functions.reduce(function (prev, curr) {
      return prev.then(curr);
    }, Promise.resolve())
      .catch(function (error) {
        callback(error);
      });
  };

  return AquiferRun;
};

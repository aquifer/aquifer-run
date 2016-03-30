# __aquifer-run will be deprecated with aquifer 1.0.0 which includes a run API in core.__

The new run API provides feature parity with this extension, adds new functionality, and simplifies configuration. Check it out in the [1.0.0 branch](https://github.com/aquifer/aquifer/tree/1.0.0)!

# aquifer-run
After you build an aquifer project there are usually a number of commands you need to run in order to update the build against the codebase (examples: `drush updb` and `drush fra`). This extension allows you to define those commands in your aquifer.json file and run them with a single command: `aquifer run`.

## Installation
To install aquifer-run, run the below command from within your Aquifer project:

```bash
aquifer extension-add aquifer-run
```

## Configuration
Before using this extension, you'll need to set up your aquifer.json or aquifer.local.json file to include run profiles. See the below property definitions and example configuration.

### Properties

- __defaultProfile__: The run profile to use if none is specified.
- __profiles__: Any number of run profiles containing the following properties:
  - __ssh__: Contains information for running the profile in a remote location.
    - __user__: The remote user.
    - __host__: The remote host.
    - __root__: The directory from which to run the profile.
  - __commands__: An array of commands to run as part of the parent profile. Each command is an object containing the following properties.
    - __name__: The command name (like "drush" or "cp").
    - __args__: An array of arguments to follow the command name. So for `drush cc all`, args would look like `["cc", "all"]`.

### Example Configuration

This example configuration includes a "local" profile and a "remote" testing profile with ssh configuration.

```json
{
  "aquifer-run": {
    "source": "aquifer-run",
    "defaultProfile": "local",
    "profiles": {
      "local": {
        "commands": [
          {
            "name": "drush",
            "args": ["updb"]
          },
          {
            "name": "drush",
            "args": ["cc", "all"]
          },
          {
            "name": "drush",
            "args": ["en", "master"]
          },
          {
            "name": "drush",
            "args": ["master-execute", "--scope=local", "-y"]
          },
          {
            "name": "drush",
            "args": ["fra", "-y"]
          }
        ]
      },
      "testing": {
        "ssh": {
          "user": "[REMOTE USER]",
          "host": "[REMOTE HOST]",
          "root": "[REMOTE DIRECTORY]"
        },
        "commands": [
          {
            "name": "drush",
            "args": ["updb", "-y"]
          },
          {
            "name": "drush",
            "args": ["cc", "all"]
          },
          {
            "name": "drush",
            "args": ["en", "master"]
          },
          {
            "name": "drush",
            "args": ["master-execute", "--scope=test", "-y"]
          },
          {
            "name": "drush",
            "args": ["fra", "-y"]
          }
        ]
      }
    }
  }
}
```

## Usage
This extension adds a `run` command to your Aquifer project. When invoked, it will run a group of defined commands called a "profile". At least one profile must be defined in [configuration](#configuration) before the run command will perform any actions. You can set a default profile with the `defaultProfile` configuration property. If no default profile is set you will need to pass the `--profile` or `-p` option to specify a profile name.

### Example usage
```bash
# Run all commands in the default profile.
aquifer run

# Run all commands in the "testing" profile.
aquifer run -p testing
```

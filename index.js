var fs = require('fs');
var os = require('os');
var chokidar = require("chokidar");
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-apollo-level", "ApolloLevel", ApolloLevelAccessory);
}

function ApolloLevelAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.filePath = config["file_path"];
  var tankHeight = config["tank_height"];
  var initialDepth = config["initial_depth"];

  var service = new Service.HumiditySensor(this.name);

  var changeAction = function(data) {
    service
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .setValue(data);
  }

  var changeHandler = function(path, stats) {
    fs.readFile(this.filePath, 'utf8', function(err, data) {
      var lastReading = null;

      if (!err && data) {
        var lines = data.split(os.EOL);
        var lastLine = lines[lines.length - 1].length ? lines[lines.length - 1] : lines[lines.length - 2];
        var lastReading = JSON.parse(lastLine);
      }
      
      if (lastReading) {
        var tankPercent = ((tankHeight + initialDepth - lastReading.depth_cm) / tankHeight) * 100.0;
        changeAction(tankPercent);
      } else {
        changeAction(null);
      }
    })
  }.bind(this);

  var watcher = chokidar.watch(this.filePath, {alwaysStat: true, usePolling: true});
  watcher.on('add', changeHandler);
  watcher.on('change', changeHandler);
  watcher.on('unlink', changeHandler);

  this.service = service;
}

ApolloLevelAccessory.prototype.getServices = function() {
  return [this.service];
}

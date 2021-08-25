const decompress = require('decompress');
const { Notification, BrowserWindow, app, ipcMain, DownloadItem, dialog, remote, TouchBarOtherItemsProxy } = require('electron');
const fs = require('fs');
const { Socket } = require('socket.io-client');

const log = console.log.bind(console);
const modulesArr = ['flSpec', 'gtSpec', 'cSpec'];


const unzip = (filedir, targetdir) => {
  decompress(filedir, targetdir)

  .then((p) => {
    if (p) {
      log(`File ${filedir} :: decompress successfull`);
    }
  })
  .catch((error) => {
    if (error) {
      log(error);
    };
  });
  
};

const checkVersion = (serverVersion, clientVersion, namespace) => {

  if (clientVersion[namespace]) {

    if (clientVersion[namespace].version != serverVersion[namespace].version) {
      return true;
    }else {
      return false;
    };

  }else {
    return false;
  };
};

const saveEntry = (jsonPath, obj) => {
  
  var dataJSON = JSON.stringify(obj, null, 4);
  fs.writeFileSync(jsonPath, dataJSON);
};

const removeEntry = (pathOfItem, jsonPath) => {

  var pre = loadJSON(jsonPath);
  var preKeep = pre.filter(item => item.path !== pathOfItem);

  if (preKeep.length < pre.length) {
    
    var write = JSON.stringify(obj, null, 4);
    fs.writeFileSync(jsonPath, write);
  }
  else {
    return log('Entry not found');
  };

};

const updateVersion = (pathOfItem, hashJsonPath, typeBool) => {
  
  // Update the client hash map file with files that have been added to the users directories
  log('version updated');

  var split = pathOfItem.split('\\');
  var namespace = split[1];

  if (modulesArr.includes(namespace)) {

    var pre = loadJSON(hashJsonPath);
    var duplicateEntry = pre.find(item => item.path == pathOfItem);

    if (typeBool) {

      if (!duplicateEntry) {

        pre.push({
          path: pathOfItem
        });

        log(hashJsonPath)
        log(pre);

        fs.writeFileSync(hashJsonPath, JSON.stringify(pre, null, 4));
      };
    }
    else if (!typeBool) {

      if (duplicateEntry) {

        removeEntry(hashJsonPath, pathOfItem);
      };
    }
  };
};

const updateHashMap = (item) => {

  var hashMapFile = fs.readFileSync('.\\content\\temp\\client.json');
  var pre = JSON.parse(hashMapFile.toString());
  var duplicateEntry = pre.find(item => item.urlpath == item.urlpath);

  pre.push({
      type: item.type,
      filename: item.filename,
      ext: item.filename,
      basename: item.basename,
      urlpath: item.urlpath
  });

  fs.writeFileSync(hashMapFile, JSON.stringify(pre, null, 4));

};

module.exports = {
  unzip: unzip,
  checkVersion: checkVersion,
  updateVersion: updateVersion,
  updateHashMap: updateHashMap
};
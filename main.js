var request = require('request');
const electron = require('electron');
const ipc = require('electron').ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow;
var storageFilePath = 'storage.json';
var fs = require('fs');

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 800})
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', function(e){
  createWindow();
  if (process.env.NODE_ENV !== 'production'){
    require('vue-devtools').install();
  }
});

ipc.on('requestSavedFile', function (e, arg) {
    fs.readFile(storageFilePath, 'utf-8', function (err, data) {
      if(err){
        console.log("An error ocurred reading the file: " + err.message);
        return;
      }
      console.log("The file content is: " + data);
      e.sender.send('loadSavedRequests', data);
    });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

ipc.on('makeRequest', function (e, requestDetails) {
  request({
    method: requestDetails.requestType,
    preambleCRLF: true,
    postambleCRLF: true,
    uri: requestDetails.requestLink,
    headers: requestDetails.requestHeader,
    body: requestDetails.requestBody,
  },
  function (error, response, body) {
    response = {
      error: error,
      response: response,
      body: body,
    };

    e.sender.send('makeResponse', response);
    return response;
  });
});

ipc.on('saveRequests', function (e, requests) {
  var filepath = storageFilePath;
  var content = JSON.stringify(requests);

  fs.writeFile(filepath, content, function (err) {
    var message = "";
    if(err){
      message = "An error ocurred while updating the file " + err.message;
      console.log(message);
      e.sender.send('saveRequestsResponse', message);
      return;
    }
    message = "Requests have been successfully saved.";
    console.log(message);
    e.sender.send('saveRequestsResponse', message);
   });
})

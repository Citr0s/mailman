var request = require('request');
const electron = require('electron');
const ipc = require('electron').ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 1200, height: 800})
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    mainWindow = null;
  })
}

app.on('ready', function(){
  createWindow();
  if (process.env.NODE_ENV !== 'production'){
    require('vue-devtools').install();
  }
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
})

const ipc = require('electron').ipcRenderer;
var mainRequestType = document.getElementsByClassName('main-request-type')[0];
var mainRequestLink = document.getElementsByClassName('main-request-link')[0];
var mainButton = document.getElementsByClassName('main-submit-button')[0];
var saveButton = document.getElementsByClassName('main-save-button')[0];
var mainBodyHidden = document.getElementsByClassName('main-body-hidden')[0];
var headerNames = document.getElementsByClassName('header-name');
var headerValues = document.getElementsByClassName('header-value');
var requestEditorHidden = document.getElementsByClassName('request-editor-hidden')[0];
var previousRequestList = document.getElementsByClassName('previous-request-list')[0];
var previousRequestsDiv = document.getElementsByClassName('previous-request');
var statusDiv = document.getElementsByClassName('response-status')[0];
var previousRequests = [];

function triggerEvent(eventType, element){
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent(eventType, false, true);
  element.dispatchEvent(evt);
}

document.addEventListener("DOMContentLoaded", function() {
  ipc.send('requestSavedFile', 'ping');
});

saveButton.addEventListener('click', function(e){

});

mainButton.addEventListener('click', function(e){
  statusDiv.innerHTML = "Waiting for response...";
  setTimeout(function(){
    var headers = {};
    for(var i = 1; i < headerNames.length; i++){
      if(headerNames[i].value.length !== 0 || headerValues[i].value.length !== 0){
        headers[headerNames[i].value] = headerValues[i].value;
      }
    }

    var requestDetails = {
      requestType: mainRequestType.value,
      requestLink: mainRequestLink.value,
      requestHeader: headers,
      requestBody: requestEditorHidden.value,
    };

    ipc.send('makeRequest', requestDetails);
    mainButton.setAttribute('disabled', '');

    ipc.on('makeResponse', function(e, data) {
      statusDiv.innerHTML = "<span class='_599'>No response.</span>";
      mainBodyHidden.value = '';
      if(typeof data.response !== 'undefined'){
        statusDiv.innerHTML = "<span class='_" + data.response.statusCode + "'>" + data.response.statusCode + " " + data.response.statusMessage + "</span>";
        try {
          mainBodyHidden.value = JSON.stringify(JSON.parse(data.body), undefined, 2);
        }
        catch(err) {
          mainBodyHidden.value = data.body;
          console.log('Couldn\'t parse JSON. Got error: ' + err);
        }
      }
      mainButton.removeAttribute('disabled');
      triggerEvent('change', mainBodyHidden);
    });
  }, 1);
});

ipc.on('loadSavedRequests', function (e, requests) {
  vue.sidebar = JSON.parse(requests);
  vue.savedRequests = vue.sidebar;
});

var vue = new Vue({
  el: '#app',
  data: {
    sidebarHeader: '',
    tabs: [{requestType: 'get', requestLink: 'http://api.football-data.org/v1/soccerseasons/424/', requestHeaders: [{name: 'X-Auth-Token', value: 'fe33c7da872942c19b6c5f236797cd7b'}]}],
    requestType: 'get',
    requestLink: 'http://api.football-data.org/v1/soccerseasons/424/',
    requestHeaders: [{name: 'X-Auth-Token', value: 'fe33c7da872942c19b6c5f236797cd7b'}],
    requestFolder: '',
    savedRequests: [],
    historicRequests: {
      folders: [{
        name: '',
        opened: true,
        savedRequests:[],
      }]
    },
    sidebar: {
      folders: [],
    },
    clicked: [false],
    active: [true]
  },
  methods: {
    addHistoryRequest: function() {
      var request = {
        requestType: this.requestType,
        requestLink: this.requestLink,
        requestHeaders: unBind(this.requestHeaders),
      };

      var exists = false;
      for(var i = 0; i < this.historicRequests.folders[0].savedRequests.length; i++){
        var currentRequest = {
          requestType: this.historicRequests.folders[0].savedRequests[i].requestType,
          requestLink: this.historicRequests.folders[0].savedRequests[i].requestLink,
          requestHeaders: unBind(this.historicRequests.folders[0].savedRequests[i].requestHeaders),
        };
        if(JSON.stringify(currentRequest) == JSON.stringify(request)){
          exists = true;
        }
      }

      if(typeof this.sidebar.folders === 'undefined'){
        return;
      }

      if(!exists){
        this.sidebar.folders[0].savedRequests.push(request);
      }

      var count = 0;
      for(var i = 0; i < this.tabs.length; i++){
        if(this.tabs[i].requestLink === this.requestLink){
          count++;
        }
      }

      if(count === 0){
        this.tabs.push(previousRequest);
      }
    },
    addSavedRequest: function(){
      var saveRequest = {
        requestType: this.requestType,
        requestLink: this.requestLink,
        requestHeaders: unBind(this.requestHeaders),
      };

      var exists = false;
      for(var i = 0; i < this.savedRequests.length; i++){
        var currentRequest = {
          requestType: this.savedRequests[i].requestType,
          requestLink: this.savedRequests[i].requestLink,
          requestHeaders: unBind(this.savedRequests[i].requestHeaders),
        };
        if(JSON.stringify(currentRequest) == JSON.stringify(saveRequest)){
          exists = true;
        }
      }

      if(this.requestFolder == ''){
        return;
      }

      if(!exists){
        var folderIndex = 0;
        for(var i = 0; i < this.sidebar.folders.length; i++){
          if(this.sidebar.folders[i].name == this.requestFolder){
            folderIndex = i;
            continue;
          }
          folderIndex = i + 1;
        }

        if(typeof this.sidebar.folders[folderIndex] === 'undefined'){
            this.sidebar.folders[folderIndex] = {
              name: this.requestFolder,
              opened: false,
              savedRequests: [],
            };
        }

        this.sidebar.folders[folderIndex].savedRequests.push(saveRequest);
        ipc.send('saveRequests', this.sidebar);
      }

      var count = 0;
      for(var i = 0; i < this.tabs.length; i++){
        if(this.tabs[i].requestLink === this.requestLink){
          this.tabs.$set(i, saveRequest);
          count++;
        }
      }

      if(count === 0){
        this.tabs.push(currentRequest);
      }
    },
    populateRequestForm: function(folderIndex, itemIndex) {
      var selectedRequest = this.sidebar.folders[folderIndex].savedRequests[itemIndex];

      if(typeof selectedRequest !== 'undefined'){
        this.requestType = selectedRequest.requestType;
        this.requestLink = selectedRequest.requestLink;
        this.requestHeaders = selectedRequest.requestHeaders;
        this.requestFolder = this.sidebar.folders[folderIndex].name;
      }

      for(var i = 0; i < this.clicked.length; i++){
        this.clicked.$set(i, true);
      }

      for(var i = 0; i < this.active.length; i++){
        this.active.$set(i, false);
      }

      var count = 0;
      for(var i = 0; i < this.tabs.length; i++){
        if(this.tabs[i].requestLink === selectedRequest.requestLink){
          this.active.$set(i, true);
          count++;
        }
      }

      if(count === 0){
        this.addTab(selectedRequest);
      }

      this.clicked.$set(this.requestHeaders.length - 1, false);
    },
    populateRequestFormUsingTabs: function(index) {
      var selectedTab = this.tabs[index];

      if(typeof selectedTab !== 'undefined'){
        this.requestType = selectedTab.requestType;
        this.requestLink = selectedTab.requestLink;
        this.requestHeaders = selectedTab.requestHeaders;
        this.tabs.$set(index, selectedTab);
      }

      for(var i = 0; i < this.clicked.length; i++){
        this.clicked.$set(i, true);
      }

      for(var i = 0; i < this.active.length; i++){
        this.active.$set(i, false);
      }

      this.active.$set(index, true);
      this.clicked.$set(this.requestHeaders.length - 1, false);
    },
    toggleHeaderRow: function(index) {
      if(!this.clicked[index]){
          this.clicked.$set(index, true);
          this.requestHeaders.$set(index + 1, {});
      }else{
        var currentClicked = [];
        for(var i = 0; i < this.clicked.length; i++){
          if(this.clicked[i] === true){
            currentClicked.push(this.clicked[i]);
          }
        }
        this.clicked.$set(currentClicked.length - 1, false);
        this.requestHeaders.$remove(this.requestHeaders[index]);
      }
    },
    addData: function(index) {
      this.requestHeaders.$set(index, {name: this.requestHeaders[index].name, value: this.requestHeaders[index].value});
    },
    addOtherData: function() {
      for(var i  = 0; i < this.active.length; i++){
        if(this.active[i] === true){
          this.tabs.$set(i, {requestType: this.requestType, requestLink: this.requestLink, requestHeaders: this.requestHeaders});
        }
      }
    },
    removeTab: function(index) {
      this.tabs.$remove(this.tabs[index]);
    },
    removePreviousRequest: function(folderIndex, itemIndex) {
      this.sidebar.folders[folderIndex].savedRequests.$remove(this.sidebar.folders[folderIndex].savedRequests[itemIndex]);
      ipc.send('saveRequests', this.sidebar);
    },
    addTab: function(request = null){
      if(request === null){
        var request = {
          requestType: 'get',
          requestLink: 'New Tab',
          requestHeaders: [{name: '', value: ''}],
        }
      }
      this.tabs.push(request);
    },
    loadSidebarData: function() {
      if(this.sidebarHeader == 'history'){
        this.sidebar = this.historicRequests;
        return;
      }
      this.sidebar = this.savedRequests;
    },
    toggleFolder: function(index) {
      var folder = this.sidebar.folders[index];

      if(folder.opened){
        folder.opened = false;
      }else{
        folder.opened = true;
      }

      this.sidebar.folders.$set(index, folder);
      ipc.send('saveRequests', this.sidebar);
    },
    shouldDisplay: function(index) {
      if(typeof this.sidebar.folders[index] === 'undefined'){
        return true;
      }
      return this.sidebar.folders[index].opened;
    },
  },
  computed: {

  },
});

function unBind(item){
  return JSON.parse(JSON.stringify(item));
}

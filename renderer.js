const ipc = require('electron').ipcRenderer;
var mainRequestType = document.getElementsByClassName('main-request-type')[0];
var mainRequestLink = document.getElementsByClassName('main-request-link')[0];
var mainButton = document.getElementsByClassName('main-submit-button')[0];
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

function updateHeaderButtonListeners(headerAddButtons, newHeaderRow, headerRowTemplate, mainForm){
  for(var i = 0; i < headerAddButtons.length; i++){
    if(i == 1 && headerAddButtons.length > 2){
      headerAddButtons[i].parentElement.removeChild(headerAddButtons[i]);
    }
    if(typeof headerAddButtons[i] == 'object'){
      headerAddButtons[i].addEventListener('click', function(e){
        e.preventDefault();
        newHeaderRow = document.createElement('div');
        newHeaderRow.setAttribute('class', 'row');
        newHeaderRow.innerHTML = headerRowTemplate.innerHTML;

        for(var j = 0; j < (newHeaderRow.children.length - 1); j++){
          newHeaderRow.children[j].children[0].children[0].value = "";
        }

        mainForm.appendChild(newHeaderRow);
        updateHeaderButtonListeners();
      });
    }
  }
}

mainButton.addEventListener('click', function(e){
  statusDiv.innerHTML = "Waiting for response...";
   ipc.send('exampleEvent')
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
        mainBodyHidden.value = JSON.stringify(JSON.parse(data.body), undefined, 2);
      }
      mainButton.removeAttribute('disabled');
      triggerEvent('change', mainBodyHidden);
    });
  }, 1);
});

new Vue({
  el: '#app',
  data: {
    requestType: 'get',
    requestLink: '',
    requestHeaders: [{name: 'X-Auth-Token', value: 'fe33c7da872942c19b6c5f236797cd7b' }],
    previousRequests: [],
    clicked: [false]
  },
  methods: {
    addPreviousRequest: function() {
      var requestHeaders = [];
      for(var i = 0; i < this.requestHeaders.length; i++){
        requestHeaders.push({name: this.requestHeaders[i].name, value: this.requestHeaders[i].value});
      }
      var previousRequest = {
        requestType: this.requestType,
        requestLink: this.requestLink,
        requestHeaders: requestHeaders,
      };
      this.clicked[this.clicked.length] = false;
      this.previousRequests.push(previousRequest);
    },
    populateRequestForm: function(index) {
      var selectedRequest = this.previousRequests[index];
      this.requestType = selectedRequest.requestType;
      this.requestLink = selectedRequest.requestLink;
      this.requestHeaders = selectedRequest.requestHeaders;
    },
    addHeaderRow: function(index) {
      this.clicked[index] = true;
      this.requestHeaders.push({});
    },
  },
})

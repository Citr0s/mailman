// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var request = require('request');

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
  setTimeout(function(){
    var headers = {};
    for(var i = 1; i < headerNames.length; i++){
      if(headerNames[i].value.length !== 0 || headerValues[i].value.length !== 0){
        headers[headerNames[i].value] = headerValues[i].value;
      }
    }

    makeRequest(mainRequestType.value, mainRequestLink.value, headers, requestEditorHidden.value);

    var previousRequestsHtml = '';

    for(var k = 0; k < previousRequests.length; k++){
      previousRequestsHtml += '<div class="previous-request" data-type="' + previousRequests[k].requestType + '" data-link="' + previousRequests[k].requestLink + '" data-header=\'' + JSON.stringify(previousRequests[k].requestHeader) + '\' data-body="' + previousRequests[k].requestBody + '"><small class="' + previousRequests[k].requestType + '">' + previousRequests[k].requestType + '</small>' + previousRequests[k].requestLink + '</div>';
    }

    previousRequestList.innerHTML = previousRequestsHtml;

    for(var l = 0; l < previousRequestsDiv.length; l++){
      previousRequestsDiv[l].addEventListener('click', function(e){
        mainRequestType.value = this.getAttribute('data-type');
        mainRequestLink.value = this.getAttribute('data-link');
        requestEditorHidden.innerHTML = this.getAttribute('data-body');
        triggerEvent('change', requestEditorHidden);

        var storedHeaders = JSON.parse(this.getAttribute('data-header'));

        var size = -1;
        for(key in storedHeaders){
          size++;
        }

        var count = 1;
        for(key in storedHeaders){
          console.log(typeof headerNames[count], typeof headerNames[count] === 'undefined');
          if(typeof headerNames[count] === 'undefined'){
            var headerRowTemplate = document.getElementsByClassName('header-row-template')[0];
            var mainForm = document.getElementsByClassName('main-submit-form')[0];
            var headerAddButtons = document.getElementsByClassName('header-add-button');

            newHeaderRow = document.createElement('div');
            newHeaderRow.setAttribute('class', 'row');
            newHeaderRow.innerHTML = headerRowTemplate.innerHTML;
            mainForm.appendChild(newHeaderRow);
            updateHeaderButtonListeners(headerAddButtons, newHeaderRow, headerRowTemplate, mainForm);
            console.log("CREATING NEW ELEMENT");
          }
          headerNames[count].value = key;
          headerValues[count].value = storedHeaders[key];
          console.log(headerNames[count].value, headerValues[count].value);
          count++;
        }

        for(var m = count; m < headerNames.length; m++){
          var element = headerNames[m].parentElement.parentElement.parentElement;
          element.parentElement.removeChild(element);
        }

        console.log(headerNames[0].value);
      });
    }
  }, 1);
});

function makeRequest(requestType, requestLink, requestHeader, requestBody){
  var requestDetails = {
    'requestType':requestType,
    'requestLink':requestLink,
    'requestHeader':requestHeader,
    'requestBody':requestBody,
  };
  previousRequests.push(requestDetails);

  request({
    method: requestType,
    preambleCRLF: true,
    postambleCRLF: true,
    uri: requestLink,
    headers: requestHeader,
    body: requestBody,
  },
  function (error, response, body) {
    console.log(response);
    statusDiv.innerHTML = "<span class='_" + response.statusCode + "'>" + response.statusCode + " " + response.statusMessage + "</span>";
    mainBodyHidden.value = JSON.stringify(JSON.parse(body), undefined, 2);
    triggerEvent('change', mainBodyHidden);
  });
}

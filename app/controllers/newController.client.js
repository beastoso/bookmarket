/*global ajaxFunctions, io*/
'use strict'; 

var appUrl = window.location.origin;
var bookUrl = appUrl + "/api/book/";
var userUrl = appUrl + '/api/user';

var userLoggedIn = false;
var webSocketConnection = false;
var userId = false;

function getWebSocket() {
	if (!webSocketConnection && userId) {
		webSocketConnection = io.connect(appUrl, {query: 'userId='+userId});
		webSocketConnection.on('news', function(data) {
			window.location.reload();
		});
	}
	return webSocketConnection;
}

function showNotification(message) {
   var notification = document.getElementById("notification");
   var messageElem = notification.getElementsByClassName("message")[0];
   messageElem.innerHTML = message;
   notification.removeAttribute("class");
}

(function () {

  var imageField = document.querySelector("input[name=imageUrl]");
  imageField.addEventListener('focusout',function() {
     var url = imageField.value;
     if (url && url != "") {
         var image = document.getElementById("cover");
         image.setAttribute("src",url);
     }
  });

  var addBtn = document.getElementById('addBtn');
  addBtn.addEventListener('click', function(e) {
     e.preventDefault();
     
     var data = {
         imageUrl: document.querySelector("input[name=imageUrl]").value,
         title: document.querySelector("input[name=title]").value,
         author: document.querySelector("input[name=author]").value,
         year: document.querySelector("input[name=year]").value,
         genre: document.querySelector("input[name=genre]").value,
         description: document.querySelector("textarea[name=description]").value,
     };
     
     ajaxFunctions.ready(ajaxFunctions.ajaxPostRequest('POST', bookUrl, JSON.stringify(data), function(response) {
         var book = JSON.parse(response);
         if (book && book._id) {
             window.location = appUrl+"/";
         }
     }));
     
  }, false);


   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl, function(data) {
      var userObj = JSON.parse(data);
      
      var loginBtn = document.getElementById("loginBtn");
      var logoutBtn = document.getElementById("logoutBtn");
      var profileBtn = document.getElementById("profileBtn");
      var nameElem = document.getElementById("name");
         
      if (userObj) {
         userId = userObj._id;
         userLoggedIn = true;
         nameElem.textContent = userObj.name;
         loginBtn.setAttribute("style","display:none;");
         profileBtn.removeAttribute("style");
         logoutBtn.removeAttribute("style");
         
         getWebSocket();
      }
      else {
         nameElem.textContent = "";
         profileBtn.setAttribute("style","display:none;");
         logoutBtn.setAttribute("style","display:none;");
         loginBtn.removeAttribute("style");
      }
      
   }));
})();

/*global ajaxFunctions, io*/
'use strict';

var appUrl = window.location.origin;
var tradeUrl = appUrl+"/api/trade/request";
var recommendationUrl = appUrl + "/api/user/recommendation";
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

   var bookUrl = appUrl + '/api/book/current';
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', bookUrl, function (data) {
      var bookObject = JSON.parse(data);

    if (bookObject) {
          var bookDiv = document.getElementById("bookDetail");
          bookDiv.setAttribute("data-id",bookObject._id);
          
          if (bookObject.image_url) {
              document.querySelector("#cover").setAttribute("src",bookObject.image_url);
          }
        
          if (bookObject.title !== null) {
              document.querySelector("#title").textContent = bookObject.title;
          }
          if (bookObject.author !== null) {
             document.querySelector("#author").textContent = bookObject.author;
          }
          
          if (bookObject.year != null) {
              document.querySelector("#year").textContent = bookObject.year;
          }
          if (bookObject.genre != null) {
              document.querySelector("#genre").textContent = bookObject.genre;
          }
          if (bookObject.description != null) {
              document.querySelector("#description").textContent = bookObject.description;
          }
          if (bookObject.holderName != null) {
              document.querySelector("#owner").textContent = bookObject.holderName;
          }
    }
   }));
   
   var tradeBtn = document.getElementById("tradeBtn");
   tradeBtn.addEventListener('click',function(e) {
       e.preventDefault();
       if (!userLoggedIn) {
         window.location = appUrl+"/login";
      }
      else {
       var bookDiv = document.getElementById("#bookDetail");
        var bookId = bookDiv.getAttribute("data-id");
        var url = tradeUrl;
        var data = JSON.stringify({'bookId':bookId});
        ajaxFunctions.ready(ajaxFunctions.ajaxPostRequest('POST', url, data, function (response) {
            var requestObj = JSON.parse(response);
             if (requestObj && requestObj.owner_user_id) {
                getWebSocket().emit('trade-request',JSON.stringify({'userId':requestObj.owner_user_id}));
                showNotification("Trade request sent!");
             }
        }));
      }
   });
   
   var recommendBtn = document.getElementById("recommendBtn");
   recommendBtn.addEventListener('click',function(e) {
       e.preventDefault();
       if (!userLoggedIn) {
         window.location = appUrl+"/login";
      }
      else {
       var bookDiv = document.getElementById("#bookDetail");
        var bookId = bookDiv.getAttribute("data-id");
        document.querySelector("input[name=recommendationBookId]").value = bookId;
        document.querySelector("input[name=recommendationEmail]").value = "";
        document.getElementById("recommend").setAttribute("class","slideIn");
      }
   });


   var sendBtn = document.getElementById("sendBtn");
   sendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      var recommendationData = {
         bookId: document.querySelector("input[name=recommendationBookId]").value,
         email: document.querySelector("input[name=recommendationEmail]").value
      };
      ajaxFunctions.ajaxPostRequest('POST', recommendationUrl, JSON.stringify(recommendationData), function(data) {
         var recommendationObj = JSON.parse(data);
         if (recommendationObj && recommendationObj.recommendee_user_id) {
            getWebSocket().emit('recommendation',JSON.stringify({'userId':recommendationObj.recommendee_user_id}));
            showNotification("Recommendation sent!");
         }
      });
   });   
   
   var closeBtn = document.getElementsByClassName("closeBtn");
   for (var i = 0; i < closeBtn.length; i++) {
       closeBtn[i].addEventListener('click', function(e) {
          e.preventDefault();
          var parent = e.target.parentElement.parentElement;
          parent.setAttribute("class","hidden");
       });
   }
   
   
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

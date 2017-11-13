/*global ajaxFunctions,io*/
'use strict';

var appUrl = window.location.origin;
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

function formatDate(dateStr) {
   var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   
   var date = new Date(dateStr);
   return (date.getDate()+1)+"-"+months[date.getMonth()]+"-"+date.getFullYear().toString().substr(2);
}

(function () {

   var saveBtn = document.querySelector('#saveBtn');
   var userUrl = appUrl + '/api/user';
   var bookUrl = appUrl + '/api/user/books';
   var requestsUrl = appUrl + '/api/trade/requests';
   var recommendUrl = appUrl + '/api/user/recommendation';
   var acceptUrl = appUrl + '/api/trade/accept';
    
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl, function(data) {
      var userObject = JSON.parse(data);
      
      var loginBtn = document.getElementById("loginBtn");
      var logoutBtn = document.getElementById("logoutBtn");
      var nameElem = document.getElementById("name");
         
      if (userObject) {
          userId = userObject._id;
         nameElem.textContent = userObject.name;
         loginBtn.setAttribute("style","display:none;");
         logoutBtn.removeAttribute("style");
      
          if (userObject.display_name) {
              document.querySelector("input[name=displayName]").value = userObject.display_name;
          }
          else if (userObject.name) {
             document.querySelector("input[name=displayName]").value = userObject.name;
          }
          
          if (userObject.full_name) {
              document.querySelector("input[name=fullName]").value = userObject.full_name;
          }
          if (userObject.city) {
              document.querySelector("input[name=city]").value = userObject.city;
          }
          if (userObject.state) {
              document.querySelector("input[name=state]").value = userObject.state;
          }
          if (userObject.country) {
              document.querySelector("input[name=country]").value = userObject.country;
          }
          
          getWebSocket();
      }
      else {
         nameElem.textContent = "";
         logoutBtn.setAttribute("style","display:none;");
         loginBtn.removeAttribute("style");
      }
      
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', bookUrl, function (data) {
      var booksObject = JSON.parse(data);
      var bookDiv = document.getElementById("myBooks");
      
      if (booksObject && Array.isArray(booksObject) && booksObject.length > 0) {
          booksObject.forEach(function(book) {
             var newBookElem = document.getElementById("dummyBook").cloneNode(true);
             newBookElem.removeAttribute("id");
             newBookElem.removeAttribute("style");
             if (book.image_url) {
                 var imageElem = newBookElem.getElementsByClassName("bookImage")[0];
                 imageElem.setAttribute("src", book.image_url);
             }
             if (book.title) {
                 var nameElem = newBookElem.getElementsByClassName("bookName")[0];
                 nameElem.textContent = book.title;
             }
             if (book.author) {
                 var authorElem = newBookElem.getElementsByClassName("bookAuthor")[0];
                 authorElem.textContent = book.author;
             }
             
             var bookLink = newBookElem.getElementsByClassName("bookLink")[0];
             bookLink.addEventListener('click', function(e){
               e.preventDefault();
               window.location = appUrl + "/view/"+book._id;
            });
             
             var bookRecommend = newBookElem.getElementsByClassName("bookRecommend")[0];
               bookRecommend.addEventListener('click', function(e){
                  e.preventDefault();
                  
                  document.querySelector("input[name=recommendationBookId]").value = book._id;
                  document.querySelector("input[name=recommendationEmail]").value = "";
                  document.getElementById("recommend").removeAttribute("class");
                  
               });
               
              newBookElem.addEventListener('mouseenter',function() {
                  var rollover = newBookElem.getElementsByClassName("bookRollover")[0];
                  rollover.setAttribute("style","display:block;");
               });
               
               newBookElem.addEventListener('mouseleave',function() {
                  var rollover = newBookElem.getElementsByClassName("bookRollover")[0];
                  rollover.setAttribute("style","display:none;");
               });
   
             bookDiv.appendChild(newBookElem);
          });
      }
      else {
          bookDiv.textContent = "No books registered yet!";
      }
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', requestsUrl, function (data) {
      var requestsObject = JSON.parse(data);
      var userRequestDiv = document.getElementById("myRequestList");
      var bookRequestDiv = document.getElementById("bookRequestList");
      
      if (requestsObject) {
          if (requestsObject.userRequests && Array.isArray(requestsObject.userRequests) && requestsObject.userRequests.length > 0) {
              requestsObject.userRequests.forEach(function(request) {
                 var newRequestElem = document.getElementById("dummyUserRequest").cloneNode(true);
                 newRequestElem.removeAttribute("id");
                 newRequestElem.removeAttribute("style");
                 if (request.date) {
                     var dateElem = newRequestElem.getElementsByClassName("requestDate")[0];
                     dateElem.textContent = formatDate(request.date);
                 }
                 if (request.title) {
                     var nameElem = newRequestElem.getElementsByClassName("requestLink")[0];
                     nameElem.setAttribute("href",appUrl+"/view/"+request.book_id);
                     nameElem.textContent = request.title;
                 }
                 var statusElem = newRequestElem.getElementsByClassName("requestStatus")[0];
                 statusElem.textContent = (request.accepted == true ? 'accepted':'pending');
                 
                 userRequestDiv.appendChild(newRequestElem);
              });
          }
          else {
              userRequestDiv.textContent = "No requests made!";
          }
          
          if (requestsObject.bookRequests && Array.isArray(requestsObject.bookRequests) && requestsObject.bookRequests.length > 0) {
              requestsObject.bookRequests.forEach(function(request) {
                 var newRequestElem = document.getElementById("dummyBookRequest").cloneNode(true);
                 newRequestElem.removeAttribute("id");
                 newRequestElem.removeAttribute("style");
                 if (request.date) {
                     var dateElem = newRequestElem.getElementsByClassName("requestDate")[0];
                     dateElem.textContent = formatDate(request.date);
                 }
                 if (request.title) {
                     var nameElem = newRequestElem.getElementsByClassName("requestLink")[0];
                     nameElem.setAttribute("href",appUrl+"/view/"+request.book_id);
                     nameElem.textContent = request.title;
                 }
                 if (request.requestUserName) {
                     var userNameElem = newRequestElem.getElementsByClassName("requestUserName")[0];
                     userNameElem.textContent = request.requestUserName;
                 }
                 if (request.requestUserEmail) {
                     var userEmailElem = newRequestElem.getElementsByClassName("requestUserEmail")[0];
                     userEmailElem.textContent = request.requestUserEmail;
                 }
                 
                 var acceptBtn = newRequestElem.getElementsByClassName("acceptBtn")[0];
                 acceptBtn.addEventListener('click', function(e) {
                     e.preventDefault();
                     var acceptData = {
                         bookId: request.book_id,
                         requesterId: request.request_user_id
                     }
                     ajaxFunctions.ajaxPostRequest('POST', acceptUrl, JSON.stringify(acceptData), function(data) {
                         if (JSON.parse(data) == true) {
                             getWebSocket().emit('trade-accept', JSON.stringify({'user_id': request.request_user_id}));
                             showNotification("Trade accepted");
                         }
                     });
                 });
                 bookRequestDiv.appendChild(newRequestElem);
              });
          }
          else {
              bookRequestDiv.textContent = "No requests received!";
          }
      }
   }));
   
   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', recommendUrl, function (data) {
      var recommendationsObject = JSON.parse(data);
      var recommendationsDiv = document.getElementById("recommendationList");
      
      if (recommendationsObject && Array.isArray(recommendationsObject) && recommendationsObject.length > 0) {
          recommendationsObject.forEach(function(recommendation) {
                 var newRequestElem = document.getElementById("dummyRecommendation").cloneNode(true);
                 newRequestElem.removeAttribute("id");
                 newRequestElem.removeAttribute("style");
                 if (recommendation.date) {
                     var dateElem = newRequestElem.getElementsByClassName("recommendationDate")[0];
                     dateElem.textContent = formatDate(recommendation.date);
                 }
                 if (recommendation.title) {
                     var nameElem = newRequestElem.getElementsByClassName("recommendationLink")[0];
                     nameElem.setAttribute("href",appUrl+"/view/"+recommendation.book_id);
                     nameElem.textContent = recommendation.title;
                 }
                 if (recommendation.userName) {
                     var userNameElem = newRequestElem.getElementsByClassName("recommendationUserName")[0];
                     userNameElem.textContent = recommendation.userName;
                 }
                 recommendationsDiv.appendChild(newRequestElem);
          });
      }
      else {
          recommendationsDiv.textContent = "No recommendations received!";
      }
   }));
   
      
   saveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      var data = {
          'displayName': document.querySelector("input[name=displayName]").value,
          'fullName': document.querySelector("input[name=fullName]").value,
          'city': document.querySelector("input[name=city]").value,
          'state': document.querySelector("input[name=state]").value,
          'country': document.querySelector("input[name=country]").value
      };
      
      ajaxFunctions.ready(ajaxFunctions.ajaxPostRequest('POST', userUrl, JSON.stringify(data), function() {
          
      }));
   });
   
   var addBtn = document.getElementById("addBookBtn");
   addBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      window.location = appUrl+"/new";
   });
   
   var sendBtn = document.getElementById("sendBtn");
   sendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      var recommendationData = {
         bookId: document.querySelector("input[name=recommendationBookId]").value,
         email: document.querySelector("input[name=recommendationEmail]").value
      };
      ajaxFunctions.ajaxPostRequest('POST', recommendationUrl, JSON.stringify(recommendationData), function(data) {
         var recommendDiv = document.getElementById("recommend");
         recommendDiv.setAttribute("class", "hidden");
      
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
})();

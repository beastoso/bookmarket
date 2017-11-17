/*global ajaxFunctions, io */
'use strict'; 

var appUrl = window.location.origin;
var userLoggedIn = false;
var userUrl = appUrl + '/api/user';
var booksUrl = appUrl + "/api/books";
var tradeUrl = appUrl + "/api/trade/request";
var recommendationUrl = appUrl + "/api/recommendation";
var webSocketConnection = false;
var userId = false;

function getWebSocket() {
	if (!webSocketConnection && userId) {
		webSocketConnection = io.connect(appUrl, { query: 'userId='+userId});
		webSocketConnection.on('news', function(data) {
			var dataObj = JSON.parse(data);
			showNotification(dataObj);
		});
	}
	return webSocketConnection;
}


function showNotification(message) {
   var notification = document.getElementById("notification");
   var messageElem = notification.getElementsByClassName("message")[0];
   messageElem.innerHTML = message;
   notification.setAttribute("class","slideIn");
}



function addBook(bookInfo) {
   var bookId = bookInfo._id;
   var newBookElem = document.getElementById("dummyBook").cloneNode(true);
   newBookElem.removeAttribute("id");
   newBookElem.removeAttribute("style");
   newBookElem.setAttribute("data-id",bookId);
   
   if (bookInfo.title) {
      var nameElem = newBookElem.getElementsByClassName("bookName")[0];
      nameElem.textContent = bookInfo.title;
   }
   if (bookInfo.image_url) {
      var imageElem = newBookElem.getElementsByClassName("bookImage")[0];
      imageElem.setAttribute("src",bookInfo.image_url);
   }
   if (bookInfo.author) {
      var authorElem = newBookElem.getElementsByClassName("bookAuthor")[0];
      authorElem.textContent = bookInfo.author;
   }
   if (bookInfo.genre) {
      newBookElem.setAttribute("data-genre",bookInfo.genre);
   }
   if (bookInfo.year) {
      newBookElem.setAttribute("data-year",bookInfo.year);
   }
   
   var bookLink = newBookElem.getElementsByClassName("bookLink")[0];
   bookLink.addEventListener('click', function(e){
      e.preventDefault();
      window.location = appUrl + "/view/"+bookId;
   });
   
   var bookTrade = newBookElem.getElementsByClassName("bookTrade")[0];
   bookTrade.addEventListener('click', function(e){
      e.preventDefault();
      if (!userLoggedIn) {
         window.location = appUrl+"/login";
      }
      else {
         var json = JSON.stringify({'bookId':bookId});
         ajaxFunctions.ajaxPostRequest('POST', tradeUrl, json, function(data) {
            var requestObj = JSON.parse(data);
            if (requestObj && requestObj.owner_user_id) {
               getWebSocket().emit('trade-request',JSON.stringify({'userId':requestObj.owner_user_id}));
               showNotification("Trade request sent!");
            }
         });
      }
   });
   
   var bookRecommend = newBookElem.getElementsByClassName("bookRecommend")[0];
   bookRecommend.addEventListener('click', function(e){
      e.preventDefault();
      
      if (!userLoggedIn) {
         window.location = appUrl+"/login";
      }
      else {
         document.querySelector("input[name=recommendationBookId]").value = bookInfo._id;
         document.querySelector("input[name=recommendationEmail]").value = "";
         document.getElementById("recommend").setAttribute("class","slideIn");
      }
   });
   
   newBookElem.addEventListener('mouseenter',function() {
      var rollover = newBookElem.getElementsByClassName("bookRollover")[0];
      rollover.setAttribute("style","display:block;");
   });
   
   newBookElem.addEventListener('mouseleave',function() {
      var rollover = newBookElem.getElementsByClassName("bookRollover")[0];
      rollover.setAttribute("style","display:none;");
   });
   
   var listDiv = document.getElementById("bookList");
   listDiv.appendChild(newBookElem);
   
}

function addRatingStars(element, ratingNumber) {
   var n,
      fullStar = "star",
      halfStar = "star-half-o",
      emptyStar = "star-o";
   for (n = 1; n <= 5; n++) {
      if (ratingNumber >= n) {
         element.appendChild(getStar(fullStar));
      }
      else if (ratingNumber == (n - 0.5)) {
         element.appendChild(getStar(halfStar));
      }
      else {
         element.appendChild(getStar(emptyStar));
      }
   }
}

function getStar(className) {
   var icon = document.createElement("i");
   icon.setAttribute("class", "fa fa-"+className);
   return icon;
}


function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}


(function () {

   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', booksUrl, function(data) {
      var books = JSON.parse(data);
      if (books && books.length > 0) {
         var booksDiv = document.getElementById("bookList");
   
         books.forEach(function(book) {
            addBook(book);
         });
         
      }
      else {
         var booksDiv = document.getElementById("bookList");
         booksDiv.textContent = "No books added yet";
      }
   }));
   
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

   var addBtns = document.getElementsByClassName('addBtn');
   for(var n = 0; n < addBtns.length; n++) {
      var addBtn = addBtns[n];
      addBtn.addEventListener('click', function(e) {
         e.preventDefault();
         window.location = appUrl+"/new";
         }, false);
   }
   
   var filterBtn = document.getElementById("filterBtn");
   filterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      var searchField = document.querySelector("input[name=filter]");
      var searchTerms = [];
      if (searchField.value && searchField.value != "") {
         searchTerms = searchField.value.split(" ");
      }
      
      var books = document.getElementsByClassName("book");
      if (books) {
         var matchCount = 0;
         for (var n = 0; n < books.length; n++) {
            var book = books[n];
            var match = false;
            
            if (book.getAttribute("id") == "dummyBook") {
               continue;
            }
            if (searchTerms.length == 0) {
               match = true;
            }
            else {
               var genre = book.getAttribute("data-genre");
               var year = book.getAttribute("data-year");
               var title = book.getElementsByClassName("bookName")[0].textContent;
               var author = book.getElementsByClassName("bookAuthor")[0].textContent;
               
               searchTerms.forEach(function(term) {
                  term = term.toLowerCase();
                  if (title && title.toLowerCase().indexOf(term) >= 0){
                     match = true;
                  }
                  else if (author && author.toLowerCase().indexOf(term) >= 0){
                     match = true;
                  }
                  else if (genre && genre.toLowerCase().indexOf(term) >= 0){
                     match = true;
                  }
                  else if (year && year.toLowerCase().indexOf(term) >= 0){
                     match = true;
                  }
                  if (match) {
                     return false;
                  }
               });
            }
            
            
            if (match) {
               matchCount++;
               book.removeAttribute("style");
            }
            else {
               book.setAttribute("style","display:none;");
            }
         }
         
         var status = document.getElementById("statusMessage");
         if (matchCount == 0) {
            status.textContent = "No books matching search filter";
         }
         else {
            status.textContent = "";
         }
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

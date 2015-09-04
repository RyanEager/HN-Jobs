
const DB_NAME = 'Whos_Hiring';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
//const DB_STORE_NAME = 'Who_Is_Hiring_Submitted';

var db;
var hn = new Firebase("https://hacker-news.firebaseio.com/v0");
var view = [];
var all = [];

openDb(getNewStories);

window.addEventListener("load", addEvents, false);

function addEvents(){
	var query = document.getElementById('searchText');
	query.addEventListener("keydown", function (e) {
	    if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
	        search();
	    }
	});
}

function search(){
	view = all;

	var newView = [];
	var query = document.getElementById('searchText').value;

	var patt = new RegExp(query);
	for (var i = 0; i < view.length; i++) {
		if(patt.test(view[i].text)){
			newView.push(view[i]);
		}
	};
	if(query.length > 0){
		view = newView;	
	}
	updateView();
}

function filter(){
	var newView = []
	var intern = document.getElementById('intern');
	var remote = document.getElementById('remote');
	var sf = document.getElementById('sf');
	var boston = document.getElementById('boston');

	var internPatt = /interns?(hips?)? /i;
	var remotePatt = /remote/i;
	var sfPatt = /(SF|San Francisco|Bay Area)/i;
	var bostonPatt = /Boston/i;

	
	for (var i = 0; i < view.length; i++) {
		if(intern.checked){
			if(internPatt.test(view[i].text)){
				newView.push(view[i]);
			}
		}
		if(remote.checked){
			if(remotePatt.test(view[i].text)){
				newView.push(view[i]);
			}
		}
		if(sf.checked){
			if(sfPatt.test(view[i].text)){
				newView.push(view[i]);
			}
		}
		if(boston.checked){
			if(bostonPatt.test(view[i].text)){
				newView.push(view[i]);
			}
		}
	};

	if(intern.checked || remote.checked || sf.checked || boston.checked){
		view = newView;
		updateView();
	}
	else{
		viewAll();
	}

}

function updateView(){
	var table = document.getElementById('data-table');
	table.innerHTML = '';
	for (var i = 0; i < view.length; i++) {
		view[i]

		var tr = table.insertRow(table.rows.length);
		var td = tr.insertCell(0);
		
		var postBottom = '<br><hr>by: <a href=https://news.ycombinator.com/user?id=' + view[i].by +'>'+ view[i].by + '</a>' 
						+ '&nbsp;&nbsp;|&nbsp;&nbsp;' + '<a href=https://news.ycombinator.com/item?id=' + view[i].id +'>HN</a>' 
						+ '&nbsp;&nbsp;|&nbsp;&nbsp;' + '<button onclick="favorite(' + view[i].id + ')">Favorite</button>'
						+ '&nbsp;&nbsp;|&nbsp;&nbsp;' + '<button onclick="hide(' + view[i].id + ')">Hide</button>'
						+ '<div align="right">posted on: ' + new Date(view[i].time * 1000).toLocaleString() + '</div>' ;

		td.innerHTML = view[i].text + postBottom;
		tr.id = view[i].id;
	};

}

function viewAll(){
	var transaction = db.transaction(['items'], "readwrite");
	var objectStore = transaction.objectStore('items');
	view = [];

	objectStore.openCursor().onsuccess = function(event) {
	  	var cursor = event.target.result;
	  	if (cursor) {
	  		view.push(cursor.value);
	    	cursor.continue();
	  	}
	  	else{
	  		all = view;
	  		updateView();
	  	}
		
	};
}

function openDb(callback) {
	console.log("openDb ...");
	var req = indexedDB.open(DB_NAME, DB_VERSION);

	req.onsuccess = function (evt) {
	  	db = this.result;
	  	console.log("openDb DONE");

	  	if(callback) callback();
	  	
	};
	req.onerror = function (evt) {
	  	console.error("openDb:", evt.target.errorCode);
	};

	req.onupgradeneeded = function (evt) {
	  	console.log("openDb.onupgradeneeded");
		evt.currentTarget.result.createObjectStore('items', { keyPath: 'id'});
		evt.currentTarget.result.createObjectStore('favorites', { keyPath: 'id'});
		evt.currentTarget.result.createObjectStore('hidden', { keyPath: 'id'});
	};


}

function getNewStories(){
	console.log('getNewStories ...')

	//get list of new stories
	hn.child("user/whoishiring/submitted").limitToFirst(3).once("value", function(snapshot) {
		new_stories = Object.keys(snapshot.val()).map(function(k) { return snapshot.val()[k] });

		//add new stories
		for (var i = 0; i < new_stories.length; i++) {
				addStory(new_stories[i]);
		};
		console.log('getNewStories DONE');
	});
	viewAll();
}

function addStory(storyID){
	hn.child("item/" + storyID).once("value", function(snapshot){

		if(snapshot.val().title.indexOf('Who is hiring?') > 0){

			hn.child("item/" + storyID + "/kids").on("child_added", function(snapshot){
				addComment(snapshot.val());
			});
		};
	});
}

function addComment(commentID){

	hn.child("item/" + commentID).once("value", function(snapshot) {

		var transaction = db.transaction(['items'], "readwrite");

		transaction.onerror = function(event) {
		  	console.error("addComment transaction:", event.target.errorCode);
		};

		var objectStore = transaction.objectStore('items');

		objectStore.onerror = function(event){
			console.error("addComment objectStore:", event.target.errorCode);
		};

		var req = objectStore.put(snapshot.val());

		req.onerror = function(event){
			console.error("addComment req:", event.target.errorCode);
		};
	});
}

function addData(db_store_name){
	console.log('adding data...')
	var transaction = db.transaction([db_store_name], "readwrite");

	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
	  	console.log("data DONE");
	};

	transaction.onerror = function(event) {
	  	console.error("addData:", event.target.errorCode);
	};

	var objectStore = transaction.objectStore(db_store_name);
	for (var i in wih_stories) {
	  	var request = objectStore.add(wih_stories[i]);
	  	request.onsuccess = function(event) {
	    // event.target.result == customerData[i].ssn;
	  };
	}

}
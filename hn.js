
const DB_NAME = 'Whos_Hiring';
const DB_VERSION = 1; // Use a long long for this value (don't use a float)
//const DB_STORE_NAME = 'Who_Is_Hiring_Submitted';

var db;
var new_stories = [];
var old_stories = [];
var hn = new Firebase("https://hacker-news.firebaseio.com/v0");

//openDb(getNewStories);
openDb(addStory('9996333'));
// openDb();


function viewAll(){
	var items = [];
	var table = document.getElementById('data-table');
	table.innerHTML = '';

	var transaction = db.transaction(['items'], "readwrite");
	var objectStore = transaction.objectStore('items');

	objectStore.openCursor().onsuccess = function(event) {
	  	var cursor = event.target.result;
	  	if (cursor) {
	    	var tr = table.insertRow(table.rows.length);
			var td = tr.insertCell(0);
			td.innerHTML = cursor.value.text;
	    	cursor.continue();
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
		evt.currentTarget.result.createObjectStore('wih_new', { keyPath: 'id'});
		evt.currentTarget.result.createObjectStore('wih_added', { keyPath: 'id'});
		evt.currentTarget.result.createObjectStore('items', { keyPath: 'id'});
	};


}

function getNewStories(){
	console.log('getNewStories ...')

	//get list of currently added stories
	var transaction = db.transaction(['wih_added'], "readwrite");
	var wih_added = transaction.objectStore('wih_added');

	wih_added.openCursor().onsuccess = function(event) {
	  	var cursor = event.target.result;
	  	if (cursor) {
	    	old_stories.push(cursor.value);
	    	cursor.continue();
	  	}
	};

	//get list of new stories
	hn.child("user/whoishiring/submitted").once("value", function(snapshot) {
		new_stories = snapshot.val();

		console.log('getNewStories: adding ' + (new_stories.length - old_stories.length) + ' stories');
	
		//add new stories
		for (var i = 0; i < new_stories.length; i++) {
			if(!old_stories.indexOf(new_stories[i])){
				addStory(new_stories[i]);
			};
		};

			console.log('getNewStories DONE')
	});
}

function addStory(storyID){
	hn.child("item/" + storyID + "/kids").on("child_added", function(snapshot){
		addComment(snapshot.val());
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
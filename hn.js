
const DB_NAME = 'Whos_Hiring';
const DB_VERSION = 2; // Use a long long for this value (don't use a float)
const DB_STORE_NAME = 'Who_Is_Hiring_Submitted';

var db;
openDb();


var wih_stories = [];
var hn = new Firebase("https://hacker-news.firebaseio.com/");

hn.child("v0/user/whoishiring/submitted").on("value", function(snapshot) {
	for (var i = 0; i < snapshot.val().length; i++) {
		if(wih_stories.indexOf(snapshot.val()[i])){
			wih_stories.push( { id: snapshot.val()[i] } );
		}
	};
	addData();
});



function openDb() {
	console.log("openDb ...");
	var req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onsuccess = function (evt) {
	  	// Better use "this" than "req" to get the result to avoid problems with
	  	// garbage collection.
	  	// db = req.result;
	  	db = this.result;
	  	console.log("openDb DONE");
	};
	req.onerror = function (evt) {
	  	console.error("openDb:", evt.target.errorCode);
	};

	req.onupgradeneeded = function (evt) {
	  	console.log("openDb.onupgradeneeded");
	  	var store = evt.currentTarget.result.createObjectStore(
	    	DB_STORE_NAME, { keyPath: 'id'});

	};
}

function addData(){
	console.log('adding data...')
	var transaction = db.transaction(["Who_Is_Hiring_Submitted"], "readwrite");

	// Do something when all the data is added to the database.
	transaction.oncomplete = function(event) {
	  	console.log("data DONE");
	};

	transaction.onerror = function(event) {
	  	console.error("addData:", evt.target.errorCode);
	};

	var objectStore = transaction.objectStore("Who_Is_Hiring_Submitted");
	for (var i in wih_stories) {
	  	var request = objectStore.add(wih_stories[i]);
	  	request.onsuccess = function(event) {
	    // event.target.result == customerData[i].ssn;
	  };
	}

}
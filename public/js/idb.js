// indexedDB database for web browser storage whenn offline.
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// Create indexedDB; name:budget, version:1.
const dbName = "budget";
const dbVersion = 1;
const request = indexedDB.open(dbName, dbVersion);
let db;
// Kick off on-upgrade-event if indexedDB doesn't exist.
request.onupgradeneeded = function (event) {
  console.log("On-Upgrade Event; IDB Database Created");
  // Access indexedDB that was just created.
  const db = event.target.result;
  // Setup undexedDB with a new_transaction object store.
  db.createObjectStore('new_transaction', { autoIncrement: true });
};
// Kick off on-sucess-event if indexedDB launched.
request.onsuccess = function (event) {
  console.log("On-Success Event; IDB Database Exists");
  // Sucess only called if upgrade was called or if indexedDB exists.
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};
// Kick off on-error-event if theres an error launching indexedDB.
request.onerror = function (event) {
  console.log("On-Error Event; Error:"+event.target.errorCode);
};
// Save into indexedDB.
function saveRecord(record) {
  console.log("APP is offline; data saved into indexedDB and will be uplaoded once APP is back online");
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  transactionObjectStore.add(record);
}
// Upload into APP database.
function uploadTransaction() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  const getAll = transactionObjectStore.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('new_transaction');
          transactionObjectStore.clear();
          console.log("APP is online again; data saved in indexedDB has been uploaded into APP database");
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}
// Upload data being recorded in indexedDB when offline once APP is online.
window.addEventListener('online', uploadTransaction);
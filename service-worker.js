importScripts('./libraries/pouchdb-7.2.1.js');

var cacheName = 'offlineCache-v10';

var contentToCache = [
  './manifest.json',
  './assets/recovery.png',
  './assets/loading.gif',
  './assets/plus.png',
  './assets/splash-192.png',
  './assets/splash-256.png',
  './assets/splash-384.png',
  './assets/splash-512.png',
  './assets/WorkSans-VariableFont_wght.ttf',
  './assets/x.png',
  './libraries/flatpickr.css',
  './libraries/flatpickr.js',
  './libraries/mithril.min.js',
  './libraries/moment.js',
  './libraries/pouchdb-7.2.1.js'
];


self.addEventListener('install', (event) => {
  console.log('Service Worker Installed');
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log('Service Worker Caching Files');
      return cache.addAll(contentToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if(key !== cacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
});

self.addEventListener('fetch', (event) => {
  var url = event.request;
  event.respondWith(
    caches.match(event.request).then(function(response) {//respond with cache first
      return response || fetch(event.request);
    })
  );
});

//push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log("recieved push notification");
  event.waitUntil(self.registration.showNotification(data.title, {body: data.body}));
});


/*
//updates a user push subscription with a new one when the old one expires
var updateSubscription = async (event) =>{

  //get the user id from the local db
  var db = new PouchDB('reminders');
  var result =  await db.get("_local/user");
  console.log(result.user_id);

  //get a new sub
  var subscription = await self.registration.pushManager.getSubscription();

  //send the new user sub to the server
  var save = {"user_id":result.user_id,"sub":subscription};
  var response = await fetch("/saveUserSub", {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json'
   },
   body:JSON.stringify(save)
 });
 if(!response.ok){throw "Could not save user push subscription";}
}

self.addEventListener('pushsubscriptionchange', function(event) {
  event.waitUntil(updateSubscription());
});*/

//require('dotenv').config({ path: 'keys.env' });

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const webPush = require('web-push');
const fs = require('fs');
const cron = require('node-cron');
const { Client } = require('pg');
const request = require('request');

/*
//database client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

//push notification keys
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;*/

//webPush.setVapidDetails('mailto:nimdhiran@gmail.com', publicVapidKey, privateVapidKey);

server.listen(process.env.PORT || 3000, () => {
  console.log('Server started');
});

//redirect to https if not already on https
if(process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}

app.use(express.json());
//serve the assets
app.use('/assets', express.static('assets'));
app.use('/libraries', express.static('libraries'));
app.use('/src', express.static('src'));
app.use('/', express.static('/'));

/***************Server routes***************/
app.get("/",(req,res) =>{
    res.sendFile(__dirname + '/index.html');
});

app.get("/manifest.json",(req,res) =>{
    res.sendFile(__dirname + '/manifest.json');
});

app.get("/service-worker.js",(req,res) =>{
    res.sendFile(__dirname + '/service-worker.js');
});


//adds a new user to the db pr updates an existing
app.get('/getMovies', async (req,res) => {
  try{
    //first get the max number of pages of results for the specified search
    request('https://api.themoviedb.org/3/discover/movie?api_key=5f48e0edcc9ae5c8ba07d5f719a7141b', { json: true }, (err, response, data) => {
      if (err) { return console.log(err); }
      console.log(data.total_pages);
      var maxPages = data.total_pages;
      //use the max pages available for the search to select a random page of movies
      var page = getRandomNum(1,maxPages);
      request(`https://api.themoviedb.org/3/discover/movie?api_key=5f48e0edcc9ae5c8ba07d5f719a7141b&page=${page}`, { json: true }, (err, response, data) => {
        if (err) { return console.log(err); }
        console.log(data);
        //using the returned data put together an array of movies containing
        //the movie title, ID, poster image, and summary

        //array containing all movie data to send to the client
        var movies = [];
        //loop through all movie data
        data.results.forEach((item)=>{
          //create a movie oject containing the relevant data the client needs
          var movie = {
            id: item.id,
            title: item.title,
            summary: item.overview,
            image: "https://image.tmdb.org/t/p/w500"+item.poster_path
          }
          //add the mobie object to the movies array
          movies.push(movie);
        })
        //send the movies array to the client
        res.send(movies);
      });
    });
  }
  catch (error){
    console.log(error);
    res.status("500").send({message: 'Failed to fetch movies'});
  }

});



//check for upcoming reminders every minute
cron.schedule('* * * * * ', async () => {
  console.log("running cron");
});

//returns a random number between a given min and max
function getRandomNum(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

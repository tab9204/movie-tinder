/**********Data for rendering app views************/
import {pouchDB,database} from './database.js';

//event handlers
var events = {
  //handles swiping on the card
  swipe: () =>{
    var card = document.querySelector(".card");

    //current postion on the screen of the card
    var currentPos;
    //delta x and y of the card position
    var diffX;
    var diffY;

    //how far the card can be swiped left or right
    var swipeThreshold = ((screen.width / 2) - (card.clientWidth / 2) - 5 );

    //the initial x and y when swiping begins
    var initialX = null;
    var initialY = null;

    card.addEventListener('touchstart', (e) => {
      //set the inital x and y where the touch begins
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;

    },{passive: true});

    card.addEventListener('touchmove', (e) => {
      //if the inital x and y have not been set exit the move touch
      if (initialX === null) {
        return;
      }
      if (initialY === null) {
        return;
      }

      //the current x and y coors of where the touch is
      var currentX = e.touches[0].clientX;
      var currentY = e.touches[0].clientY;
      //how far the touch has been dragged from the inital point of contact
      diffX = initialX - currentX;
      diffY = initialY - currentY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        // sliding horizontally
        if (diffX > 0) {
          // swiped left
          currentPos = e.currentTarget.style.left == "" ? 0 : e.currentTarget.style.left;

          e.currentTarget.style.left = Math.abs(parseInt(currentPos) - diffX) <= swipeThreshold ? parseInt(currentPos) - diffX : swipeThreshold * -1;

          initialX = currentX;

        } else {
          currentPos = e.currentTarget.style.left == "" ? 0 : e.currentTarget.style.left;

          e.currentTarget.style.left = Math.abs(parseInt(currentPos) - diffX) <= swipeThreshold ? parseInt(currentPos) - diffX : swipeThreshold;

          initialX = currentX;
        }
      }
      else{
        //stop dragging if this is an up or down swipe
        return;
      }
    },{passive: true});

    card.addEventListener('touchend', (e) => {

      if(parseInt(currentPos) - diffX >= swipeThreshold){
        movies.swipeYes();
      }
      else if(parseInt(currentPos) - diffX <= (swipeThreshold * -1)){
        movies.swipeNo();
      }

      initialX = null;
      initialY = null;

      e.currentTarget.classList.add("slideIn");

    },{passive: true});
  }
}

var movies = {
  //the currently selected movie shown on the movie card
  selected:{
    id: null,
    title: null,
    summary: null,
    image: null
  },
  //gets the first movie in the movie stack and adds it as the selected movie
  selectCard: async () => {
    var allMovies = await pouchDB.getAllMovies();
      movies.selected.id = allMovies.rows[0].doc.movie.id;
      movies.selected.title =  allMovies.rows[0].doc.movie.title;
      movies.selected.summary =  allMovies.rows[0].doc.movie.summary;
      movies.selected.image =  allMovies.rows[0].doc.movie.image;
      m.redraw();
  },
  //what happens when a user swipes yes (right) on the selected movie
  swipeYes: async () =>{
    //add this movie to the swiped movies db
    await pouchDB.addSwipedMovie(movies.selected.id);
    //remove this movie from the movie stack
    await pouchDB.removeMovie("movie-"+movies.selected.id);
    //get a new card from the movie stack
    movies.selectCard();
    //save the movie title to the server db

    console.log("swiped yes");
  },
  //what happens when a user swipes no (left) on the selected movie
  swipeNo: async () =>{
    //add this movie to the swiped movies db
    await pouchDB.addSwipedMovie(movies.selected.id);
    //remove this movie from the movie stack
    await pouchDB.removeMovie("movie-"+movies.selected.id);
    //get a new card from the movie stack
    movies.selectCard();

    console.log("swiped no");
  },
  //gets and returns a stack of movies
  requestStack: async () =>{
    //fetch the movie stack
    var response = await fetch("/getMovies", {
      method: 'GET'
    });

    if(!response.ok){throw "Could not get any movies";}

    var data = await response.json();

    return data;

  },
  //downloads move image posters to the browser
  //posters => movie data returned from the server
  //finishedLoading => function to run after all images have finished downloading
  downloadPosters: (posters,finishedLoading) =>{
    //counter to keep track of images as they are downloaded
    var downloaded = 0;
    //loop through all the posters
    posters.forEach(async(item, i) => {
      //create a new image object
      var image = new Image();
      //assign a src to the new image
      image.src = item;
      //wait for the image to download
      await image.decode();
      console.log("image downloaded");
      //increment the loaded counter now the the image is downloaded
      downloaded ++;
      //if all images have been downloaded call the finish function
      if(downloaded == posters.length){
        finishedLoading();
      }
    });
  }
}

export{events,movies};

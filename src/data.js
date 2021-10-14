/**********Data for rendering app views************/
import {pouchDB,database} from './database.js';

//event handlers
var events = {
  //card swipe events
  swipe: () =>{
    var card = document.querySelector(".card");
    //current postion on the screen of the card
    var currentPos;
    //delta x and y of the card position
    var diffX;
    var diffY;

    //how far the card can be swiped left or right on the screen
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
        if (diffX > 0) {// swiped left
          //if the card position is not set yet start it a 0, otherwise use the current position of the card
          currentPos = e.currentTarget.style.left == "" ? 0 : e.currentTarget.style.left;
          //move the card by the delta x of the swipe or if the card is at the threshold keep it there
          e.currentTarget.style.left = Math.abs(parseInt(currentPos) - diffX) <= swipeThreshold ? parseInt(currentPos) - diffX : swipeThreshold * -1;
          //update the inixial x to the current x position
          initialX = currentX;

        } else {//swiped right
          //same as when the card was swiped to the left
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
      //if the card was dragged to the threshold to the right
      if(parseInt(currentPos) - diffX >= swipeThreshold){
        //animate the card off the screen to the right
        e.currentTarget.classList.add("slideRight");
      }
      //if the card was dragged to the threshold to the left
      else if(parseInt(currentPos) - diffX <= (swipeThreshold * -1)){
        //animate the card off the screen to the left
        e.currentTarget.classList.add("slideLeft");
      }
      //the card was not dragged to the left of right threshold
      else{
        //animate the card back to the center of the screen
        e.currentTarget.classList.add("slideIn");
      }
      //reset the variables
      initialX = null;
      initialY = null;
      currentPos = "";
    },{passive: true});
  }
}
//movie data
var movies = {
  //if movies have alreay been requested or not
  //prevents multiple requests from happening at a time
  moviesRequested:false,
  //keeps track of how long movies are being requested
  //if the request goes too long without returning enough movies we end the request
  requestTimeout: 0,
  //the currently selected movie shown on the movie card
  selected:{
    id: null,
    title: null,
    summary: null,
    image: null
  },
  //gets the first movie in the movie stack and adds it as the selected movie
  //asynchronous => if the request for more movies should be async or not
  selectMovieFromStack: async (asynchronous) => {
    try{
      //get all movies currently in the stack
      var allMovies = await pouchDB.getAllMovies();

      console.log(allMovies.rows.length + " movies in the stack");

      //only select a card if there is at least 1 movie in the stack
      if(allMovies.rows.length >= 1){
        //set the selected movie to the first movie in the stack db
        movies.selected.id = allMovies.rows[0].doc.movie.id;
        movies.selected.title =  allMovies.rows[0].doc.movie.title;
        movies.selected.summary =  allMovies.rows[0].doc.movie.summary;
        //get the poster image attachment
        var poster = await pouchDB.movieStack.getAttachment("movie-"+allMovies.rows[0].doc.movie.id, 'poster.jpg');
        //poster is returned as a blob so convert it to a url
        var url = URL.createObjectURL(poster);
        //set the selected image to the url
        movies.selected.image =  url;
        //redraw the view
        m.redraw();
      }
      //if the stack is empty but there is a movie request in progress
      else if(allMovies.rows.length <= 0 && movies.moviesRequested){
        //try selecting a movie again until there are movies in the stack or the request is finished
        movies.selectMovieFromStack();
      }
    }
    catch (error){
      console.log(error);
    }
  },
  //what happens when a user swipes yes (right) on the selected movie
  swipeYes: async () =>{
    try{
      //remove the selected movie from the movie stack
      await pouchDB.removefromMovieStack("movie-"+movies.selected.id);
      //add the selected movie to the swiped movies db
      await pouchDB.addSwipedMovie(movies.selected.id);
      //save the movie to the server db
      database.addMovieToServer({title:movies.selected.title,movie_id: movies.selected.id});
      //request more movies for the stack if not already doing so
      if(!movies.moviesRequested){movies.requestMovies();}
      //get a new movies from the movie stack
      movies.selectMovieFromStack(true);
      console.log("swiped yes");
    }
    catch (error){
      //if there is a conflict then the movie was already added to the swipe db
      if(error.status = 409){
        //get the next movie and reset the card
        await movies.selectMovieFromStack(true);
        movies.resetCard();
      }
    }
  },
  //what happens when a user swipes no (left) on the selected movie
  swipeNo: async () =>{
    try{
      //remove the selected movie from the movie stack
      await pouchDB.removefromMovieStack("movie-"+movies.selected.id);
      //add the selected movie to the swiped movies db
      await pouchDB.addSwipedMovie(movies.selected.id);
      //request more movies for the stack is not already doing so
      if(!movies.moviesRequested){movies.requestMovies();}
      //get a new card from the movie stack
      movies.selectMovieFromStack(true);
      console.log("swiped no");
    }
    catch (error){
      //if there is a conflict then the movie was already added to the swipe db
      if(error.status = 409){
        await movies.selectMovieFromStack();
        movies.resetCard();
      }
    }
  },
  //get a stack of movies from TMDB and adds them to the movies db
  requestMovies: async () =>{
    //tracks the number of movies added to the stack
    var moviesAdded = 0;
    //get all movies currently in the stack
    var allMovies = await pouchDB.getAllMovies();
    //if the number of movies in the stack is greater then X exit the function since we have enough movies in the stack already
    if(allMovies.rows.length > 2){
      return;
    }
    //set the moviesRequested to true since we are about to request some movies
    movies.moviesRequested = true;
    //fetch the movie stack
    var response = await fetch("/getMovies", {
      method: 'GET'
    });
    if(!response.ok){throw "Could not get any movies";}
    //the movies returned by the TMDB api
    var movieData = await response.json();
    //add the new movies to the stack
    for (var movie of movieData) {
      try{
        //if the new movie is both not in the stack or swiped movies we can add it to the stack
        await pouchDB.addToMovieStack(movie);
        //increment the movies added
        moviesAdded++;
      }
      catch (error){
        console.log(error);
        //if there was an error adding the movie increment anyway
        moviesAdded++;
      }
      //once all movies requested have been added to the stack
      if(moviesAdded == movieData.length){
        //remove any duplicate movies from the movie stack
        var remaining = await movies.trimStack();
        //if there are no movies remaining in the stack after the trimming
        //and the request has not hit the timeout threshold
        if(remaining == 0 && movies.requestTimeout <= 5){
          //increment the timeout counter
          movies.requestTimeout++;
          //request more movies
          movies.requestMovies();
        }
        //if there is at least 1 movie in the stack or the request has gone on too long
        else{
          //reset the timeout counter
          movies.requestTimeout = 0;
          //end this request by setting it to false
          movies.moviesRequested = false;
        }
      }
    }
  },
  //removes duplicate movies from the stack
  //returns the number of movies in the stack after trimming
  trimStack: async () =>{
    //get all movies currently in the stack
    var stackMovies = await pouchDB.getAllMovies();
    //get all movies in the swiped db
    var swipeMovies = await pouchDB.getAllSwipedMovies();
    //loop through all movies in the stack
    for (var stackMovie of stackMovies.rows) {
      //loop through all movies in the swipe db
      for (var swipeMovie of swipeMovies.rows) {
        //if the id of the movie in the stack matchs a movie in the swipe db
        if(stackMovie.doc.movie.id == swipeMovie.doc.movie_id){
          //remove the movie from the stack since it is a duplicate
          await pouchDB.removefromMovieStack("movie-"+stackMovie.doc.movie.id);
        }
      }
    }
    //get an updated list of movies in the stack
    //return how many movies are in the stack
    stackMovies = await pouchDB.getAllMovies();
    return stackMovies.rows.length;
  },
  //resets the position of the movie card to its default
  resetCard: () =>{
    try{
      var card = document.querySelector(".card");
      //need to wait a brief moment before resetting the card
      //this prevents the user from seeing the old image in the card when it resets
      setTimeout(function(){
        //remove any sliding animation class
        card.classList.remove("slideLeft");
        card.classList.remove("slideRight");
        //reset the left position
        card.style.left = "0px";
      }, 250)
    }
    catch(error){
      console.log("No card oh well");
    }

  }
}

export{events,movies};

import "../libraries/pouchdb-7.2.1.js";
/*********local and server database functionality********/

//local DB using pouch
var pouchDB = {
  //local db containing a stack of movies for the user to swipe on
  movies: new PouchDB('movieStack'),
  //db containg the id of movies the user already swiped yes or no to
  swipedMovies:  new PouchDB('swiped'),
  //creates a user ID and adds it to the local db or gets an ID if one exists
  initUser: async () =>{
    try{
      //check the local db for a stored user code
      var result =  await pouchDB.local.get("_local/user");
      //assigned the returned id to the user_id variable
      database.user_id = result.user_id;
      console.log("user ID already exists: " + database.user_id);
    }
    catch (error){
      //if there is a 404 error returned then there is no user id so create one
      if(error.status = 404){
        //generate a random semi unique number to use as the id
        var random = (Math.floor(Math.random() * 100) * Date.now());
        try{
          //add the new user id to the local db
          var localUser = await pouchDB.local.put({"_id": "_local/user", "user_id": random});
          database.user_id = random;
          console.log("user ID created: " + random);
        }
        catch (error){
          console.log(error);
        }
      }
      else{
        //if the error is not a 404 then log the error
        console.log(error);
      }
    }
  },
  //adds a movie to the movie stack db
  addMovie: async (movie) =>{
    await pouchDB.movies.put({"_id": "movie-"+movie.id,"movie": movie});
    console.log("movie added to stack");
  },
  //removes the specified movie from the movie stack db
  removeMovie: async (id) =>{
    var movie = await pouchDB.movies.get(id);
    var remove = await pouchDB.movies.remove(movie);
    console.log("Movie removed from stack db");
  },
  //adds a movie id to the swiped db
  addSwipedMovie: async (id) =>{
    await pouchDB.movies.put({"_id": "swipe-"+id,"movie_id": id});
    console.log("ID added to swipe db");
  },
  //returns all movies in the stack db
  getAllMovies: async () =>{
    var movies = await pouchDB.movies.allDocs({include_docs: true})
    return movies;
  }
}

//fetch requets to the server database
var database = {
  user_id: null
}

export{pouchDB,database};

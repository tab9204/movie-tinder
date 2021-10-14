import "../libraries/pouchdb-7.2.1.js";
/*********local and server database functionality********/

//local DB using pouch
var pouchDB = {
  //local db containing a stack of movies for the user to swipe on
  movieStack: new PouchDB('movieStack'),
  //db containg the id of movies the user already swiped yes or no to
  swipedMovies:  new PouchDB('swiped'),
  //creates a user ID and adds it to the local db or gets an ID if one exists
  initUser: async () =>{
    try{
      //check the local db for a stored user code
      var result =  await pouchDB.movieStack.get("_local/user");
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
          var localUser = await pouchDB.movieStack.put({"_id": "_local/user", "user_id": random});
          database.user_id = random;
          //add the new user to the users db
          await database.addUserToServer(random);

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
  addToMovieStack: async (movie) =>{
    //get a blob of the movie poster image url
    var blob = await fetch(movie.image).then((result) =>{return result.blob()}).catch((error) =>{console.log("could not fetch the poster image")});
    //convert the blob to at base64 string
    var base64 = await blobToBase64(blob);
    //put the movie data into the stack db
    await pouchDB.movieStack.put({
      "_id": "movie-"+movie.id,
      "movie": movie,
       "_attachments": {
         "poster.jpg": {
           "content_type": "image/jpeg",
           data: base64
         }
       }
    });
    console.log("movie added to stack");
  },
  //removes the specified movie from the movie stack db
  removefromMovieStack: async (id) =>{
    var movie = await pouchDB.movieStack.get(id);
    var remove = await pouchDB.movieStack.remove(movie);
    console.log("Movie removed from stack");
  },
  //adds a movie id to the swiped db
  addSwipedMovie: async (id) =>{
    await pouchDB.swipedMovies.put({"_id": "swipe-"+id,"movie_id": id});
    console.log("Movie added to swipe db");
  },
  //returns all movies in the stack db
  getAllMovies: async () =>{
    var movies = await pouchDB.movieStack.allDocs({include_docs: true, attachments: true})
    return movies;
  },
  //returns all movies in the swiped db
  getAllSwipedMovies: async () =>{
    var swiped = await pouchDB.swipedMovies.allDocs({include_docs: true, attachments: true})
    return swiped;
  }
}

//fetch requests to the server database
var database = {
  user_id: null,
  //adds the user to the server db
  addUserToServer: async(user_id) =>{
    //request reminders from the server
   var response = await fetch("/addUser", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({"user_id":user_id})
    });
    //if the response contains an error there was an issue getting the reminders
    if(!response.ok){throw "Could not add user to the server db";}
    else{console.log("User added to the server db");}
  },
  //adds a movie to the users swiped movies
  addMovieToServer: async(movie) =>{
   var response = await fetch("/addMovie", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({user_id: database.user_id, movie:movie})
    });
    //if the response contains an error there was an issue getting the reminders
    if(!response.ok){throw "Could not add the movie to the server db";}
    else{console.log("Movie added to the server db");}
  }
}

//converts a blog to a base64 string
function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

export{pouchDB,database};

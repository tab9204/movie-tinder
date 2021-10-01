/*****app views****/
import {events,movies} from './data.js';
import {database,pouchDB} from './database.js';

/************components*************/
var card = {
  view: (vnode)=>{
    return m(".card",{onanimationend: async (e)=>{
          if(e.target.classList.contains("slideIn")){
          //set the reminder left style back to the default 0px
          e.currentTarget.style.left = "0px";
          //remove the slideIn class from the reminder
          e.target.classList.remove("slideIn");
          }
        }
      },[
      m("img.face.front",{src: movies.selected.image}),
      m(".face.back","Back")
    ])
  }
}

/**********Views**********/

//home screen
var homeScreen = {
  oninit: async () => {
    movies.selectCard();
  },
  onbeforeremove: function(vnode) {
    //defer removing the view until after the nav animation finishes
    return new Promise(function(resolve) {
        setTimeout(() => {resolve();}, 300);
    })
  },
  oncreate: () =>{
    //set up the refresh event handler
    events.swipe();
  },
  view: (vnode)=>{
    return m("homeScreen.contentView",[
      m(".pageContent",[
        m(".pageSection.cardContainer", [
          m(card)
        ])
      ]),
    ])
  }
}

//loading screen to show while getting reminders from the db
var loadingScreen = {
  oninit: async () => {
    try{
      //check the stack db for movies
      var allMovies = await pouchDB.getAllMovies();
      var posters = [];
      //if there are less then 12 movies in the movie stack
      if(allMovies.rows.length <= 12){
        //request more movies from the server
        var data = await movies.requestStack();
        //add the new movies to the stack db
        data.forEach(async (item, i) => {
          await pouchDB.addMovie(item);
        });
        //get the updated list of all movies in the db
        allMovies = await pouchDB.getAllMovies();

        allMovies.rows.forEach((item, i) => {
          posters.push(item.doc.movie.image)
        });
        //download the poster images of all the movies in the db
        movies.downloadPosters(posters,()=>{setTimeout(function(){ window.location = "#!/home"; }, 1000);});
      }
      //there are more then 12 movies in the stack
      else{
        //download the posters of the movies already in db
        allMovies.rows.forEach((item, i) => {
          posters.push(item.doc.movie.image)
        });
        //download the poster images of all the movies in the db
        movies.downloadPosters(posters,()=>{setTimeout(function(){ window.location = "#!/home"; }, 1000);});
      }
    }
    catch (error){
      //if there is an error just show the homescreen
      setTimeout(function(){ window.location = "#!/home"; }, 1000);
    }
  },
  view: (vnode)=>{
    return m("loadingScreen.contentView",[
      m(".pageContent",[
        m ("img.loading", {src:"./assets/loading.gif"})
      ])
    ])
  }
}


export{homeScreen,loadingScreen};

/*****app views****/
import {events,movies} from './data.js';
import {database,pouchDB} from './database.js';

/************components*************/
//the movie card
var card = {
  view: (vnode)=>{
    return m(".card",{onanimationend: async (e)=>{
          //if the card was swiped right and slide out to the right
          if(e.target.classList.contains("slideRight")){
            //right swipe function
            movies.swipeYes();
          }
          //if the card was swiped left and slide out to the left
          else if(e.target.classList.contains("slideLeft")){
            //left swipe function
            movies.swipeNo();
          }
          //if the card was not swiped left or right and slide back in
          else if(e.target.classList.contains("slideIn")){
            //set the reminder left style back to the default 0px
            e.currentTarget.style.left = "0px";
            //remove the slideIn class from the reminder
            e.target.classList.remove("slideIn");
          }
        }
      },[
      m("img.face.front",{src: movies.selected.image, onload: ()=>{
        //when the card image loads reset the card position to the default
        movies.resetCard();
      }}),
      m(".face.back","Back")
    ])
  }
}

//footer component
var footer = {
  view: ()=>{
    return m(".footer",[
      m("img.recovery", {src:"./assets/recovery.png", onclick: () => {window.location = "#!/recovery";}})
    ])
  }
}


/**********Views**********/

//home screen
var homeScreen = {
  onbeforeremove: function(vnode) {
    //defer removing the view until after the nav animation finishes
    return new Promise(function(resolve) {
        setTimeout(() => {resolve();}, 300);
    })
  },
  oncreate: () =>{
    //set up the card swipe events
    events.swipe();
  },
  view: (vnode)=>{
    return m("homeScreen.contentView",[
      m(".pageContent",[
        m(".pageSection.cardContainer", [
          m(card)
        ])
      ]),
      m(footer)
    ])
  }
}

//loading screen
var loadingScreen = {
  oninit: async () => {
    try{
      //request a stack of movies from the sever
      await movies.requestMovies();
      //select a movie
      await movies.selectMovieFromStack();

      //navigate to the homeScreen
      setTimeout(function(){ window.location = "#!/home"; }, 1000)

    }
    catch (error){
      console.log(error);
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

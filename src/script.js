import {homeScreen,loadingScreen} from './views.js';
//import {} from './data.js';
import {pouchDB} from './database.js';
import "../libraries/mithril.min.js";

window.onload = async () =>{
  //start the app on the main screen
  window.location = "#!/loading";

  await pouchDB.initUser();

  var root = document.body.children[0];

  m.route(root, "/home",{
    "/home": homeScreen,
    "/loading": loadingScreen
  })

}

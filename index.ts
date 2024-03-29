var express = require('express')
var app = new express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname+'/pictures'));
app.use(express.static(__dirname+'/css'));
app.use(express.static(__dirname+'/PicPages'));


var all_users = {};


// app.get('/', (req, res) => {
// 	res.sendFile(__dirname + '/index.html');
// });

//login page

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/homePage.html');
});
// chat page
app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
 
});
app.get('/photos', (req, res) => {
  res.sendFile(__dirname + '/photos.html');
 
});
app.get("/gatherTown_portal", (req, res) => {
  res.sendFile(__dirname + '/gatherTown.html');
});
app.get("/photos_squirrels", (req, res) => {
  res.sendFile(__dirname + '/Squirrels.html');
});
app.get("/photos_nature", (req, res) => {
  res.sendFile(__dirname + '/nature.html');
});
app.get("/photos_aerial", (req, res) => {
  res.sendFile(__dirname + '/aerial.html');
});
app.get("/photos_campus", (req,res) => {
  res.sendFile(__dirname + '/campus.html');
});
app.get("/photos_oswald", (req,res) => {
  res.sendFile(__dirname + '/oswald.html');
});



function get_users_and_statuses() {
  // //Shows all users' ids on webpage
  let client_ids = Object.keys(io.engine.clients); // get ids (strings) of all current connections
  let client_info = {};
  for (var i = 0; i < client_ids.length; i++) {
    let client_id = client_ids[i];
    client_info[client_id] = {
      "isPaired": io.engine.clients[client_id].isPaired
      // "user_nickame": io.engine.clients[client_id].user_name
    };
  }
  console.log(client_info);
  io.emit('show_all_users', client_info); // send to all users

}



//show that a user is connected
// io.of("/login").on('connection', (socket) => {

io.on('connection', function(socket){

  socket.on('connect', () => {
    console.log('a user connected');
    console.log('object keys: ', Object.keys(io.engine.clients));
    console.log('engine.clients: ', io.engine.clients);
    console.log('clients[id]: ', io.engine.clients[id]);
    console.log('socket.id: ', socket.id);
    console.log('clients[id]: ' + io.engine.clients[id]);
    io.engine.clients[socket.id]["isPaired"] = false;
  })
  


  socket.send(socket.id);
  socket.on("hi", (msg) => {
    
  	console.log("the msg:", msg);
  });

  socket.on("register_name", (username) => {
    console.log('object keys: ', Object.keys(io.engine.clients));
    console.log('engine.clients: ', io.engine.clients);
    console.log('clients[socket.id]: ', io.engine.clients[socket]);
    console.log('socket.id: ', socket.id);
    io.engine.clients[socket.id]["user_nickname"] = username;
    socket.emit("check_name_passed");
    
    
  });
 // socket.on("check_name", (username) => {
  //   if (!io.engine.clients.hasOwnProperty(username)) {
  //     io.engine.clients[socket.id]["user_nickname"] = username;
  //     //console.log(io.engine.clients[socket.id]);
  //     socket.emit("check_name_passed");
  //   } 
  //   else {
  //     console.log("oh no username exists already lmao");
  //     socket.emit("check_name_failed");
  //   }
  // });


//pair button
  socket.on("pairplease", (msg) => {
  	// console.log("Here yall:", socket.id);
  	if(Object.keys(io.engine.clients).length == 1 ){
  		socket.emit('alone');
  	}
  	else{
  		const ids_without_you = Object.keys(io.engine.clients).filter(function (id) {
          return id != socket.id && // not you
          io.engine.clients[id]["isPaired"] == false && // not already paired
          io.engine.clients[id].user_nickname // has chosen a username
      }); 
  		const random_id = ids_without_you[Math.floor(Math.random() * ids_without_you.length)];
      if (random_id == undefined) {
        socket.emit('alone');
      }
      else {
        let other_socket = io.sockets.sockets[random_id];

        //they're  paired
        io.engine.clients[random_id]["isPaired"] = true;
        io.engine.clients[socket.id]["isPaired"] = true;
        // other_socket.emit('youre_paired', {'other_id': io.engine.clients[socket.id]["user_nickname"]});

        // actually pair them up
        let new_room = socket.id + "_" + random_id;   
        console.log(new_room);
        //join room requires callback bc asychronous
        socket.join(new_room, function () {
          console.log(socket.id + " now in rooms ", socket.rooms);

          // name of room to send info to
          io.engine.clients[socket.id]["roomName"] = new_room;

          socket.emit("you_joined_room");
          other_socket.emit("you_joined_room");
        });
        other_socket.join(new_room, function () {
          console.log(other_socket.id + " now in rooms ", socket.rooms);
          
          // name of room to send info to
          io.engine.clients[random_id]["roomName"] = new_room;

          other_socket.emit("you_joined_room");
          socket.emit("you_joined_room");
        });


        // notify that they're paired
        other_socket.emit('pair', io.engine.clients[socket.id]["user_nickname"]); 
        socket.emit('pair', io.engine.clients[random_id]["user_nickname"]);
        

      }

      get_users_and_statuses();
      // io.emit('show_all_users', client_info); // send to all users

  	}

    //redirect user
  	// var destination = '/chat'; 
    // socket.emit('redirect', destination);
  });


 //Gets username of user
 socket.on("register_username", (msg) => {
 	console.log("I got this info yall", msg);
});

 get_users_and_statuses();
 
socket.on('send_chat_message_to_server', (msg) => {
  let room_name = io.engine.clients[socket.id]["roomName"];
  console.log("msg: ", msg, "    socket-id: ", socket.id); 
  socket.to(room_name).emit('get_chat_message_from_server', {"message": msg, "user": io.engine.clients[socket.id]["user_nickname"]});
  
  // io.socket.emit('get_chat_message_from_server2', {"message": msg, "user": io.engine.clients[socket.id]["user_nickname"]});
  // this.emit('get_chat_message_from_server2', {"message": msg, "user": io.engine.clients[socket.id]["user_nickname"]});
  
});

//Shows that user disconnected
socket.on('disconnect', () => {
  console.log('user disconnected');
  //  socket.broadcast.emit('chat message', '***SOMEONE LEFT THE CHAT***');
  let client_ids = Object.keys(io.engine.clients); // get ids (strings) of all current connections
  // socket.broadcast.emit('user_logged_off', 'User Disconnected'); // send to all users
  
 });
});


//sends message to chat
io.of("/login").on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});



http.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});
 
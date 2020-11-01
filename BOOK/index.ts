var express = require('express')
var app = new express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname+'/pictures'));

var all_users = {};


// app.get('/', (req, res) => {
// 	res.sendFile(__dirname + '/index.html');
// });

//login page

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/chat.html');
});

// chat page
app.get('/login', (req, res) => {
	res.sendFile(__dirname + '/login.html');
 
});

app.get('/photos', (req, res) => {
  res.sendFile(__dirname + '/photos.html');
 
});

app.get("/special_thanks", (req, res) => {
  res.sendFile(__dirname + '/credit.html');
});

function get_users_and_statuses() {
  // //Shows all users' ids on webpage
  let client_ids = Object.keys(io.engine.clients); // get ids (strings) of all current connections
  let client_info = {};
  for (var i = 0; i < client_ids.length; i++) {
    let client_id = client_ids[i];
    client_info[client_id] = {
      "isPaired": io.engine.clients[client_id].isPaired
    };
  }
  console.log(client_info);
  io.emit('show_all_users', client_info); // send to all users

}



//show that a user is connected
// io.of("/login").on('connection', (socket) => {

io.on('connection', function(socket){


  console.log('a user connected');
  socket.broadcast.emit('chat message', `*** ${socket.id} JOINED THE CHAT***`);
  // socket["isPaired"] = false;

  io.engine.clients[socket.id]["isPaired"] = false;


  socket.send(socket.id);
  socket.on("hi", (msg) => {
  	console.log("the msg:", msg);
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

  // onlyfans
  socket.on("register_name", (username) => {
    io.engine.clients[socket.id]["user_nickname"] = username;
    socket.emit("check_name_passed");
  });

//pair button
  socket.on("pairplease", (msg) => {
  	// console.log("Here yall:", socket.id);
  	if(Object.keys(io.engine.clients).length == 1 ){
  		socket.emit('alone');
  	}
  	else{
  		const ids_without_you = Object.keys(io.engine.clients).filter((id) => id != socket.id && io.engine.clients[id]["isPaired"] == false);
  		const random_id = ids_without_you[Math.floor(Math.random() * ids_without_you.length)];
      if (random_id == undefined) {
        socket.emit('alone');
      }
      else {
        let other_socket = io.sockets.sockets[random_id];

        //they're no longer paired
        io.engine.clients[random_id]["isPaired"] = true;
        io.engine.clients[socket.id]["isPaired"] = true;
        other_socket.emit('youre_paired', {'other_id': io.engine.clients[socket.id]["user_nickname"]});

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
    		socket.emit('pair', random_id); 

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


// get message
socket.on('send_chat_message_to_server', (msg) => {
  let room_name = io.engine.clients[socket.id]["roomName"];
  console.log("msg: ", msg, "    room name: ", room_name);
  io.to(room_name).emit('get_chat_message_from_server', {"message": msg, "user": io.engine.clients[socket.id]["user_nickname"]});
});

//Shows that user disconnected
socket.on('disconnect', () => {
   console.log('user disconnected');
   socket.broadcast.emit('chat message', '***SOMEONE LEFT THE CHAT***');
   let client_ids = Object.keys(io.engine.clients); // get ids (strings) of all current connections
   io.emit('show_all_users', client_ids); // send to all users
 });
});

//sends message to chat
io.of("/login").on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});



http.listen(5000, () => {
  console.log('listening on *:5000');
});
 
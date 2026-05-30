import express from "express";
import { Server } from "socket.io";
import { createServer } from 'node:http';
import cors from "cors";
import { log } from "node:console";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server( server,{
  cors: {
    origin:  "*",
    }
  });
  
let onlineUsers = 0;
let waitingUsers = [];
let pairs = {}; 
io.on('connection', (socket) => {
  onlineUsers++;
  console.log('Total users on online = ', onlineUsers)

  if (waitingUsers.length > 0) {
    const partner = waitingUsers.shift();
    // create a room 
    const roomId = socket.id + "-" + partner.id;

    // joining to same room socket and partner 
    socket.join(roomId);
    partner.join(roomId);

    // store pairing
    pairs[socket.id] = partner.id;
    pairs[partner.id] = socket.id;

    socket.roomId = roomId;
    partner.roomId = roomId;

    console.log("Matched:", socket.id, "with", partner.id);

    // notify both with initiator role
    partner.emit("matched", {
      initiator: true,
    });

    socket.emit("matched", {
      initiator: false,
    });
  }else{
    // if no one in room
    waitingUsers.push(socket);
    socket.emit('waiting');

     console.log("User added to queue:", socket.id);
  }
  // send count when users connect to all people
  io.emit('user-count' , onlineUsers)

  socket.on('user-message', (msg) => {
    console.log(msg);

    // sent user message within thier rooms 
    const roomId = socket.roomId;
    if (roomId) {
      io.to(roomId).emit('receive-message', {
        text: msg,
        id: socket.id
      });
     }

    })
  socket.on("offer", (offer) => {
    const roomId = socket.roomId;

    if (roomId) {
      socket.to(roomId).emit("offer", offer);
    }
  });

  socket.on("answer" , (answer) => {
    const roomId = socket.roomId;
    if(roomId){
      socket.to(roomId).emit("answer" , answer);
    }
  })

  socket.on("ice-candidate",(candidate) => {
    const roomId = socket.roomId;
    if(roomId){ 
      socket.to(roomId).emit("ice-candidate",  candidate);
    }
  });
  console.log('a user connected' , socket.id);

  // when user disconnect
  socket.on('disconnect', () => {
    onlineUsers--;
    console.log('Total users on online = ', onlineUsers)
    // send count when user disconnect
    io.emit('user-count', onlineUsers)
    console.log('a user disconnected' , socket.id);

    const partnerId = pairs[socket.id];

    //  user had a partner
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);

      // remove pairing
      delete pairs[partnerId];
      delete pairs[socket.id];

      if (partnerSocket) {

         partnerSocket.emit("partner-disconnected");
        // remove old room info
        partnerSocket.roomId = null;

        console.log("Partner became free:", partnerSocket.id);

        // 🔥 Treat partner like NEW USER
        if (waitingUsers.length > 0) {
          const newPartner = waitingUsers.shift();

          const roomId = partnerSocket.id + "-" + newPartner.id;

          partnerSocket.join(roomId);
          newPartner.join(roomId);

          pairs[partnerSocket.id] = newPartner.id;
          pairs[newPartner.id] = partnerSocket.id;

          partnerSocket.roomId = roomId;
          newPartner.roomId = roomId;

          partnerSocket.emit("matched", {
            initiator: true,
          });

          newPartner.emit("matched", {
            initiator: false,
          });

          console.log("Re-matched:", partnerSocket.id, newPartner.id);
        } else {
          waitingUsers.push(partnerSocket);
          partnerSocket.emit("waiting");

          console.log("Partner added to queue:", partnerSocket.id);
        }
      }
    }

    // remove user disconnected from user  queue
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);
  })
  //when user skips
  socket.on("next-user", () => {
    console.log(socket.id, "clicked skip");
    const partnerId = pairs[socket.id];

    if (!partnerId) return;

    const partnerSocket = io.sockets.sockets.get(partnerId);

    delete pairs[socket.id];
    delete pairs[partnerId];

    //to clear old rooms 
    const oldRoomId = socket.roomId;

    if (oldRoomId) {
      socket.leave(oldRoomId);

      if (partnerSocket) {
        partnerSocket.leave(oldRoomId);
      }
    }
    // clear old room
    socket.roomId = null;

    if (partnerSocket) {
      partnerSocket.roomId = null;
    }

    //this may be reusable code !!!!
    // For the A user
    if (waitingUsers.length > 0) {
    const newPartner = waitingUsers.shift();

    const roomId = socket.id + "-" + newPartner.id;

    socket.join(roomId);
    newPartner.join(roomId);

    pairs[socket.id] = newPartner.id;
    pairs[newPartner.id] = socket.id;

    socket.roomId = roomId;
    newPartner.roomId = roomId;

    socket.emit("matched", {
      initiator: true,
    });

    newPartner.emit("matched", {
      initiator: false,
    });

    console.log("Re-matched:", socket.id, newPartner.id);

  } else {
    waitingUsers.push(socket);

    socket.emit("waiting");

    console.log("Added to queue:", socket.id);
  }

  // for the B user
  if (partnerSocket) {
    if (waitingUsers.length > 0) {
      const newPartner = waitingUsers.shift();

      const roomId = partnerSocket.id + "-" + newPartner.id;

      partnerSocket.join(roomId);
      newPartner.join(roomId);

      pairs[partnerSocket.id] = newPartner.id;
      pairs[newPartner.id] = partnerSocket.id;

      partnerSocket.roomId = roomId;
      newPartner.roomId = roomId;

      partnerSocket.emit("matched", {
        initiator: true,
      });

      newPartner.emit("matched", {
        initiator: false,
      });

      console.log("Re-matched:", partnerSocket.id, newPartner.id);

    } else {
      waitingUsers.push(partnerSocket);

      partnerSocket.emit("waiting");

      console.log("Added to queue:", partnerSocket.id);
    }
  }

  })
});



app.use(cors());

app.get('/', (req, res) => {
  console.log('hello')
  res.send('hi');
});
// server connection
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
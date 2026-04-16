import express from "express";
import { Server } from "socket.io";
import { createServer } from 'node:http';
import cors from "cors";
import { log } from "node:console";

const app = express();
const server = createServer(app);
const io = new Server( server,{
  cors: {
    origin: ["http://localhost:5173", "http://frontend:5173"],
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

    // notify both
    io.to(roomId).emit("matched");
  }else{
    // if noo one in room
    waitingUsers.push(socket);
    socket.emit('waiting');

     console.log("User added to queue:", socket.id);
  }
  // send count when users connect
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

          io.to(roomId).emit("matched");

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
});



app.use(cors());

app.get('/', (req, res) => {
  console.log('hello')
  res.send('hi');
});
// server connection
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
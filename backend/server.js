import express from "express";
import { Server } from "socket.io";
import { createServer } from 'node:http';
import cors from "cors";
import { log } from "node:console";

const app = express();
const server = createServer(app);
const io = new Server( server,{
  cors: {
    origin: "http://localhost:5173",
    }
  });

io.on('connection', (socket) => {
  socket.on('user-message', (msg) => {
    console.log(msg);
    io.emit('receive-message', {
        text: msg,
        id: socket.id
      });
    })
  console.log('a user connected' , socket.id);
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
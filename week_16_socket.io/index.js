// const http = require("http");
// const express = require("express");
const path = require("path");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// // new server has been created
// const io = new Server(server);

// // and all the socket.io connection
// io.on("connection", (socket) => {
//   socket.on("client-message", (e) => {
//     console.log(e);
//     // if any message comes just send to all
//     io.emit("message", e);
//   });
//   // console.log("new socket is created ", socket.id);
// });

// // for the http requies use express
// app.use(express.static(path.resolve("./public")));

// app.get("/", (req, res) => {
//   return res.sendFile("/public/index.html");
// });
// server.listen(9000, () => {
//   console.log("yes i am here on 9000 ");
// });

// // ////////////////////////////////////////////////////////////////////
const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

async function main() {
  // open the database file
  const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database,
  });

  // create our 'messages' table (you can ignore the 'client_offset' column for now)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `);

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
  });

  app.use(express.static(path.resolve("./public")));

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
  });

  io.on("connection", async (socket) => {
    socket.on("chat message", async (msg) => {
      let result;
      try {
        // store the message in the database
        result = await db.run("INSERT INTO messages (content) VALUES (?)", msg);
      } catch (e) {
        // TODO handle the failure
        return;
      }
      // include the offset with the message
      io.emit("chat message", msg, result.lastID);
    });

    if (!socket.recovered) {
      // if the connection state recovery was not successful
      try {
        await db.each(
          "SELECT id, content FROM messages WHERE id > ?",
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit("chat message", row.content, row.id);
          }
        );
      } catch (e) {
        // something went wrong
      }
    }
  });
  server.listen(3000, () => {
    console.log("server running at http://localhost:3000");
  });
}

main();

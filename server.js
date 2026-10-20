
import http from "http";
import fs from "fs";
import { WebSocketServer } from "ws";

const PORT = 3001;

// Create HTTP server and serve the chat UI
const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error loading page");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast a message to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on("connection", (socket, req) => {
  const username = new URL(
    req.url,
    "http://localhost"
  ).searchParams.get("username");

  // Announce that the user joined
  broadcast({
    type: "system",
    text: `${username} joined`
  });

  socket.on("message", (message) => {
    try {
      const { username, text } = JSON.parse(message.toString());

      broadcast({
        type: "chat",
        username,
        text
      });
    } catch (error) {
      console.error("Invalid message received:", error.message);
    }
  });

  socket.on("close", () => {
    broadcast({
      type: "system",
      text: `${username} left`
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log("Chat server running at http://localhost:3001");
});

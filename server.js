const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

const rooms = new Map();

function handleConnection(ws, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);

  room.add(ws);

  ws.on('message', (message) => {
    for (const client of room) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on('close', () => {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
}

server.on('upgrade', (request, socket, head) => {
  const { pathname } = url.parse(request.url);
  const roomId = pathname.slice(1);

  wss.handleUpgrade(request, socket, head, (ws) => {
    handleConnection(ws, roomId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Signaling server is running on port ${PORT}`);
});


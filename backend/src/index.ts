import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from './GameManager';
import dotenv from 'dotenv';

dotenv.config({
  path: './.env'
});

const wss = new WebSocketServer({ port: Number(process.env.PORT) || 3000 });

const gameManager = new GameManager();

wss.on('connection', function connection(ws: WebSocket) {
  gameManager.addUser(ws);

  ws.on("close", () => gameManager.removeUser(ws));
});

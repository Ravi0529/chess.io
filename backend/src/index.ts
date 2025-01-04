import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from './GameManager';
import dotenv from 'dotenv';

dotenv.config({
  path: './.env'
});


const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const wss = new WebSocketServer({
  port: port,
  host: '0.0.0.0',
  clientTracking: true,
  perMessageDeflate: false
});

const gameManager = new GameManager();

wss.on('connection', function connection(ws: WebSocket) {
  gameManager.addUser(ws);

  ws.on("close", () => gameManager.removeUser(ws));
});

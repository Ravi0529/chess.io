import { WebSocket } from "ws";
import { INIT_GAME, MOVE, CREATE_ROOM, JOIN_ROOM } from "./messages";
import { Game } from "./Game";

interface Room {
    id: string;
    users: WebSocket[];
    game?: Game;
}

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];
    private rooms: Room[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.rooms = [];
    }

    // Adds a user and sets up message handlers
    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);
    }

    // Removes a user from active users and rooms
    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);

        // Handle pending users in random matchmaking
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }

        // Remove user from any room
        this.rooms = this.rooms.filter(room => {
            room.users = room.users.filter(user => user !== socket);

            // Clean up the room if it's empty
            if (room.users.length === 0) {
                room.game = undefined;
                return false;
            }
            return true;
        });
    }

    // Message handler
    private addHandler(socket: WebSocket) {
        socket.on("message", (data: string) => {
            try {
                const message = JSON.parse(data.toString());
                if (!message || !message.type) {
                    return;
                }

                if (message.type === INIT_GAME) {
                    if (this.pendingUser) {
                        const game = new Game(this.pendingUser, socket);
                        this.games.push(game);
                        this.pendingUser = null;
                    } else {
                        this.pendingUser = socket;
                    }
                }

                if (message.type === MOVE) {
                    if (!message.payload || !message.payload.move) {
                        return;
                    }

                    const { from, to } = message.payload.move;
                    if (!from || !to) {
                        return;
                    }

                    // Find the game
                    const game = this.games.find(game =>
                        game.player1 === socket || game.player2 === socket
                    );
                    if (game) {
                        game.makeMove(socket, message.payload.move);
                    }
                }

                // Create a room
                if (message.type === CREATE_ROOM) {
                    const roomId = message.payload?.roomId;
                    if (!roomId) {
                        return;
                    }

                    if (!this.rooms.find(room => room.id === roomId)) {
                        this.rooms.push({ id: roomId, users: [socket] });
                        socket.send(JSON.stringify({
                            type: CREATE_ROOM,
                            payload: { success: true, roomId }
                        }));
                    } else {
                        socket.send(JSON.stringify({
                            type: CREATE_ROOM,
                            payload: { success: false, error: "Room already exists" }
                        }));
                    }
                }

                // Join a room
                if (message.type === JOIN_ROOM) {
                    const roomId = message.payload?.roomId;
                    if (!roomId) {
                        return;
                    }

                    const room = this.rooms.find(room => room.id === roomId);
                    if (room) {
                        if (room.users.length < 2) {
                            room.users.push(socket);
                            socket.send(JSON.stringify({
                                type: JOIN_ROOM,
                                payload: { success: true, roomId }
                            }));

                            // Start game if 2 players join
                            if (room.users.length === 2) {
                                room.game = new Game(room.users[0], room.users[1]);
                            }
                        } else {
                            socket.send(JSON.stringify({
                                type: JOIN_ROOM,
                                payload: { success: false, error: "Room is full" }
                            }));
                        }
                    } else {
                        socket.send(JSON.stringify({
                            type: JOIN_ROOM,
                            payload: { success: false, error: "Room not found" }
                        }));
                    }
                }

                // Handle moves for room-based games
                if (message.type === MOVE) {
                    if (!message.payload || !message.payload.move) {
                        return;
                    }

                    const { from, to } = message.payload.move;
                    if (!from || !to) {
                        return;
                    }

                    const room = this.rooms.find(room => room.users.includes(socket));
                    if (room?.game) {
                        room.game.makeMove(socket, message.payload.move);
                    }
                }
            } catch (err) {
                console.error("Error handling message:", err);
            }
        });
    }
}

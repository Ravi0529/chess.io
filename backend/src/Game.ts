import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    public board: Chess;
    private startTime: Date;
    private moveCount: number = 0;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.startTime = new Date();
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white",
            }
        }))
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black",
            }
        }))
    }

    makeMove(socket: WebSocket, move: { from: string; to: string }) {
        if (this.moveCount % 2 === 0 && socket !== this.player1) {
            return;
        }

        if (this.moveCount % 2 === 1 && socket !== this.player2) {
            return;
        }
    
        try {
            this.board.move(move);
        }
        catch (e) {
            return;
        }
    
        // Broadcast the move to BOTH players (White and Black)
        const moveDetails = {
            type: MOVE,
            payload: {
                ...move,
                color: this.moveCount % 2 === 0 ? "w" : "b"
            },
        };
    
        this.player1.send(JSON.stringify(moveDetails));
        this.player2.send(JSON.stringify(moveDetails));
    
        // Check if the game is over
        if (this.board.isGameOver()) {
            const winner = this.board.turn() === "w" ? "Black" : "White";
    
            const gameOverMessage = {
                type: GAME_OVER,
                payload: { winner },
            };
    
            this.player1.send(JSON.stringify(gameOverMessage));
            this.player2.send(JSON.stringify(gameOverMessage));
            return;
        }
        this.moveCount++;
    }
}

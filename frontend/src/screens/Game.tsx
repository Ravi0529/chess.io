import { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import Button from "../components/Button";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

const Game: React.FC = () => {

    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message)
            switch (message.type) {
                case INIT_GAME:
                    setStarted(true);
                    setBoard(chess.board());
                    break;
                case MOVE:
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    break;
                case GAME_OVER:
                    break;
            }
        }
    }, [socket]);

    if (!socket) return <div>Connecting...</div>

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 text-white p-4">
            <div className="flex-1 flex justify-center mb-6 md:mb-0">
                <div className="rounded-lg">
                    <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-6">
                <div>
                    {!started && <Button
                        onClick={() => {
                            socket.send(JSON.stringify({
                                type: INIT_GAME
                            }));
                        }}
                    >
                        Play
                    </Button>}
                </div>
            </div>
        </div>
    );
}

export default Game;

import { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import Button from "../components/Button";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const CREATE_ROOM = "create_room";
export const JOIN_ROOM = "join_room";

const Game: React.FC = () => {

    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

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

    if (!socket) return <div>Connecting...</div>;

    // Handle room creation
    const handleCreateRoom = () => {
        const generatedRoomId = Math.random().toString(36).substring(2, 8); // Random room ID
        setRoomId(generatedRoomId);
        setIsHost(true);

        socket.send(
            JSON.stringify({
                type: CREATE_ROOM,
                payload: { roomId: generatedRoomId },
            })
        );
    };

    // Handle joining a room
    const handleJoinRoom = (roomId: string) => {
        setRoomId(roomId);
        socket.send(
            JSON.stringify({
                type: JOIN_ROOM,
                payload: { roomId },
            })
        );
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 text-white p-4">
            <div className="flex-1 flex justify-center mb-6 md:mb-0">
                <div className="rounded-lg">
                    <ChessBoard
                        chess={chess}
                        setBoard={setBoard}
                        socket={socket}
                        board={board}
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-6">
                <div>
                    {!started && !isHost && (
                        <Button
                            onClick={() => {
                                socket.send(JSON.stringify({ type: INIT_GAME }));
                            }}
                        >
                            Play Online
                        </Button>
                    )}

                    {!started && !isHost && (
                        <Button onClick={handleCreateRoom}>Play with Friend</Button>
                    )}

                    {!started && isHost && (
                        <div>
                            <p>Your Room ID: {roomId}</p>
                            <button
                                className="px-12 md:px-20 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition duration-300 text-lg"
                                onClick={() => navigator.clipboard.writeText(roomId!)}
                            >
                                Copy Room ID
                            </button>
                        </div>
                    )}

                    {!started && !isHost && (
                        <div>
                            <input
                                type="text"
                                placeholder="Enter Room ID"
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId || ""}
                                className="px-4 py-2 text-lg bg-gray-700 text-white rounded-md mb-4"
                            />
                            <Button onClick={() => handleJoinRoom(roomId!)}>Join Room</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;

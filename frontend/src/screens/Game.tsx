import { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import Button from "../components/Button";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
import jsPDF from "jspdf";

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
    const [moves, setMoves] = useState<string[]>([]);
    const [promotion, setPromotion] = useState<{ from: string, to: string } | null>(null);
    const [promotionPiece, setPromotionPiece] = useState<string | null>(null);

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

                    setMoves((prevMoves) => [
                        ...prevMoves,
                        `${move.from}-${move.to}`,
                    ]);

                    chess.move(move);
                    setBoard(chess.board());
                    break;
            }
        };
    }, [socket]);

    useEffect(() => {
        if (promotion && promotionPiece) {
            const move = {
                from: promotion.from,
                to: promotion.to,
                promotion: promotionPiece,
            };
            socket?.send(
                JSON.stringify({
                    type: MOVE,
                    payload: { move },
                })
            );
            chess.move(move);
            setBoard(chess.board());
            setPromotion(null);
            setPromotionPiece(null);
        }
    }, [promotionPiece]);

    if (!socket) return <div>Connecting...</div>;

    // Handle creating a room
    const handleCreateRoom = () => {
        const generatedRoomId = Math.random().toString(36).substring(2, 8);
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

    // Function to download moves as a PDF
    const downloadMovesAsPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Chess Moves", 10, 10); // Title

        // Table header
        doc.setFontSize(12);
        doc.text("No.   From   To", 10, 20);
        doc.line(10, 22, 80, 22);
        let y = 30;
        const pageHeight = doc.internal.pageSize.height;
        moves.forEach((move, index) => {
            const [from, to] = move.split("-");
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
                doc.setFontSize(12);
                doc.text("No.   From   To", 10, y);
                doc.line(10, y + 2, 80, y + 2);
                y += 10;
            }
            doc.text(`${index + 1}.    ${from}     ${to}`, 10, y);
            y += 10;
        });
        doc.save("chess_moves.pdf");
    };

    const handlePromotion = (from: string, to: string) => {
        setPromotion({ from, to });
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
                        setPromotion={handlePromotion}
                    />
                </div>
            </div>

            {promotion && (
                <div className="promotion-box text-black bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-center uppercase tracking-wide">
                    Promote Pawn To:
                </h3>
                <div className="flex justify-center gap-4">
                    {['q', 'r', 'b', 'n'].map((piece) => (
                        <button
                            key={piece}
                            onClick={() => setPromotionPiece(piece)}
                            className="p-2 bg-slate-300 hover:bg-slate-400 text-white rounded-md shadow-md transition duration-300"
                        >
                            <img
                                src={`/${chess.turn() === 'w' ? 'w' : 'b'}${piece}.png`}
                                className="w-9 h-9"
                            />
                        </button>
                    ))}
                </div>
            </div>
            )}

            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-6">
                <div>
                    {!started && !isHost && (
                        <Button
                            disabled={started}
                            onClick={() => {
                                socket.send(JSON.stringify({ type: INIT_GAME }));
                            }}
                        >
                            Play Online
                        </Button>
                    )}

                    {!started && !isHost && (
                        <Button disabled={started} onClick={handleCreateRoom}>
                            Play with Friend
                        </Button>
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
                            <Button disabled={started} onClick={() => handleJoinRoom(roomId!)}>
                                Join Room
                            </Button>
                        </div>
                    )}
                </div>
                {started && (
                    <div className="moves-list mt-6 w-full max-h-[400px] overflow-y-auto bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-4 text-white">Moves</h3>
                        <table className="w-full table-auto text-gray-300">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="text-left py-2">#</th>
                                    <th className="text-left py-2">From</th>
                                    <th className="text-left py-2">To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {moves.map((move, index) => {
                                    const isWhite = index % 2 === 0;
                                    const [from, to] = move.split("-");

                                    return (
                                        <tr
                                            key={index}
                                            className={`py-1 ${isWhite ? "text-white" : "text-gray-400"
                                                }`}
                                        >
                                            <td className="py-2">{index + 1}.</td>
                                            <td className="py-2">{from}</td>
                                            <td className="py-2">{to}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <button
                            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition duration-300"
                            onClick={downloadMovesAsPDF}
                        >
                            Download Moves as PDF
                        </button>
                    </div>

                )}
            </div>
        </div>
    );
};

export default Game;

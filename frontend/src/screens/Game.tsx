import { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import Button from "../components/Button";
import GameOver from "../components/GameOver";
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
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [moves, setMoves] = useState<string[]>([]);
    const [promotion, setPromotion] = useState<{ from: string, to: string } | null>(null);
    const [promotionPiece, setPromotionPiece] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [checkSquare, setCheckSquare] = useState<string | null>(null);
    const [myColor, setMyColor] = useState<"w" | "b">("w");

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case INIT_GAME:
                    setStarted(true);
                    const color = message.payload.color === 'white' ? 'w' : 'b';
                    setMyColor(color);
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

                    // Check for check or checkmate
                    if (chess.isCheckmate()) {
                        setGameOver(true);
                        setWinner(chess.turn() === 'w' ? 'Black' : 'White');
                    } else if (chess.isCheck()) {
                        const kingSquare = chess.turn() === 'w'
                            ? chess.board().flat().find(sq => sq?.type === 'k' && sq.color === 'w')?.square
                            : chess.board().flat().find(sq => sq?.type === 'k' && sq.color === 'b')?.square;
                        setCheckSquare(kingSquare || null);
                    } else {
                        setCheckSquare(null);
                    }
                    break;

                case GAME_OVER:
                    setGameOver(true);
                    setWinner(message.payload.winner);
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
            setCheckSquare(null);
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
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 text-white p-4 gap-4">
            {/* Chessboard Section */}
            <div className="w-full md:w-[80%] max-w-[800px] flex justify-center">
                <div className="rounded-lg bg-gray-800 p-3">
                    <ChessBoard
                        chess={chess}
                        setBoard={setBoard}
                        socket={socket}
                        board={board}
                        setPromotion={handlePromotion}
                        checkSquare={checkSquare}
                        myColor={myColor}
                    />
                </div>
            </div>

            {promotion && (
                <dialog open className={`promotion-box ${myColor === 'w' ? 'bg-slate-700' : 'bg-gray-400'} rounded-lg shadow-lg fixed inset-40 flex items-center justify-center p-2`}>
                    <div className="flex justify-center gap-4">
                        {['q', 'r', 'b', 'n'].map((piece) => (
                            <button
                                key={piece}
                                onClick={() => setPromotionPiece(piece)}
                                className="hover:bg-gray-500 rounded-md shadow-md transition duration-300"
                            >
                                <img
                                    src={`/${chess.turn() === 'w' ? 'w' : 'b'}${piece}.png`}
                                    className="w-12 h-12"
                                />
                            </button>
                        ))}
                    </div>
                </dialog>
            )}

            {gameOver && <GameOver winner={winner} />}

            {/* Sidebar Section */}
            <div className="w-full md:w-[20%] max-w-[300px] flex flex-col gap-4 p-4 bg-gray-800 rounded-lg">
                {!started && !isHost && (
                    <div className="flex flex-col gap-4">
                        <Button
                            disabled={started}
                            onClick={() => {
                                socket.send(JSON.stringify({ type: INIT_GAME }));
                            }}
                        >
                            Play Online
                        </Button>
                        <Button disabled={started} onClick={handleCreateRoom}>
                            Play with Friend
                        </Button>
                    </div>
                )}

                {!started && isHost && (
                    <div className="flex flex-col gap-4">
                        <p>Your Room ID: {roomId}</p>
                        <button
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg shadow-md transition duration-300"
                            onClick={() => navigator.clipboard.writeText(roomId!)}
                        >
                            Copy Room ID
                        </button>
                    </div>
                )}

                {!started && !isHost && (
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            onChange={(e) => setRoomId(e.target.value)}
                            value={roomId || ""}
                            className="px-4 py-2 text-lg bg-gray-700 text-white rounded-md"
                        />
                        <Button disabled={started} onClick={() => handleJoinRoom(roomId!)}>
                            Join Room
                        </Button>
                    </div>
                )}

                {started && (
                    <div className="flex-1 overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-white">Moves</h3>
                        <div className="flex flex-col gap-2">
                            {moves.map((move, index) => {
                                const [from, to] = move.split("-");
                                return (
                                    <div key={index} className="flex justify-between text-gray-300">
                                        <span>{index + 1}.</span>
                                        <span>{from}</span>
                                        <span>{to}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            className="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition duration-300"
                            onClick={downloadMovesAsPDF}
                        >
                            Download Moves as PDF
                        </button>
                    </div>
                )}

                {gameOver && <GameOver winner={winner} />}
            </div>
        </div>
    );
};

export default Game;

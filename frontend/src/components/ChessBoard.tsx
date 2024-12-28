import { Square, PieceSymbol, Color } from 'chess.js';
import { useState } from 'react';

const ChessBoard: React.FC<{
    board:
    ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket | null;
}> = ({ board, socket }) => {

    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);

    return (
        <div className="Chessboard">
            {board.map((row, i) => (
                <div key={i} className="flex">
                    {row.map((square, j) => (
                        <div
                            key={j}
                            className={`w-12 h-12 flex items-center justify-center ${(i + j) % 2 === 0 ? "bg-gray-500" : "bg-gray-300"
                                }`}
                        >
                            {square && (
                                <div
                                    className={`text-4xl ${square.color === "w" ? "text-white" : "text-black"
                                        }`}
                                >
                                    {square ? square.type : ""}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default ChessBoard;

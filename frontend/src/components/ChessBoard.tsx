import { Square, PieceSymbol, Color } from 'chess.js';
import { useState } from 'react';
import { MOVE } from '../screens/Game';

const ChessBoard: React.FC<{
    board:
    ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket | null;
    setBoard: any;
    chess: any;
}> = ({ board, socket, setBoard, chess }) => {

    const [from, setFrom] = useState<null | Square>(null);

    return (
        <div className="Chessboard">
            {board.map((row, i) => (
                <div key={i} className="flex">
                    {row.map((square, j) => {
                        const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;

                        return <div
                            key={j}
                            onClick={() => {
                                if (!from) {
                                    setFrom(squareRepresentation);
                                } else {
                                    socket?.send(JSON.stringify({
                                        type: MOVE,
                                        payload: {
                                            move: {
                                                from,
                                                to: squareRepresentation
                                            }
                                        }
                                    }));
                                    setFrom(null);
                                    chess.move({
                                        from,
                                        to: squareRepresentation
                                    });
                                    setBoard(chess.board());
                                }
                            }}
                            className={`w-12 h-12 flex items-center justify-center ${(i + j) % 2 === 0 ? "bg-gray-500" : "bg-gray-300"
                                }`}
                        >
                            {square ? (
                                <img
                                    className="w-[4.25rem]"
                                    src={`/${square?.color === 'b' ? `b${square.type}` : `w${square.type}`}.png`}
                                />
                            ) : null}
                        </div>
                    })}
                </div>
            ))}
        </div>
    );
}

export default ChessBoard;

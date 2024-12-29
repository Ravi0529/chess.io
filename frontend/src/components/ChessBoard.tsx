import { Square, PieceSymbol, Color } from 'chess.js';
import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { MOVE } from '../screens/Game';

const ChessBoard: React.FC<{
    board: ({
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
                        const squareRepresentation = String.fromCharCode(97 + (j % 8)) + '' + (8 - i) as Square;

                        // Drop functionality for drag-and-drop
                        const [{ isOver }, dropRef] = useDrop(() => ({
                            accept: 'CHESS_PIECE',
                            drop: (item: { from: Square }) => {
                                handleMove(item.from, squareRepresentation);
                            },
                            collect: (monitor) => ({
                                isOver: !!monitor.isOver(),
                            }),
                        }));

                        // Handle moves (shared logic for both drag and click)
                        const handleMove = (fromSquare: Square, toSquare: Square) => {
                            if (fromSquare && toSquare) {
                                socket?.send(
                                    JSON.stringify({
                                        type: MOVE,
                                        payload: {
                                            move: { from: fromSquare, to: toSquare },
                                        },
                                    })
                                );
                                chess.move({ from: fromSquare, to: toSquare });
                                setBoard(chess.board());
                                setFrom(null); // Reset selection
                            }
                        };

                        return (
                            <div
                                key={j}
                                ref={dropRef}
                                onClick={() => {
                                    if (!from) {
                                        setFrom(squareRepresentation); // Set the piece to move
                                    } else {
                                        handleMove(from, squareRepresentation); // Handle the move
                                    }
                                }}
                                className={`w-12 h-12 flex items-center justify-center ${(i + j) % 2 === 0 ? 'bg-gray-500' : 'bg-gray-300'
                                    } ${isOver ? 'bg-yellow-300' : ''}`}
                            >
                                {square ? (
                                    <ChessPiece
                                        square={square}
                                        from={squareRepresentation}
                                        setFrom={setFrom}
                                    />
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const ChessPiece: React.FC<{
    square: {
        type: PieceSymbol;
        color: Color;
    };
    from: Square;
    setFrom: (square: Square) => void;
}> = ({ square, from, setFrom }) => {
    const [, dragRef] = useDrag(() => ({
        type: 'CHESS_PIECE',
        item: { from },
    }));

    return (
        <motion.img
            ref={dragRef}
            className="w-[4.25rem] cursor-pointer"
            src={`/${square.color === 'b' ? `b${square.type}` : `w${square.type}`}.png`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
        />
    );
};

export default ChessBoard;

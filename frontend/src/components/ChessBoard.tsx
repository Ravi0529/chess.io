import { Square, PieceSymbol, Color, Chess } from 'chess.js';
import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { MOVE } from '../screens/Game';

type ChessBoardProps = {
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket | null;
    setBoard: any;
    chess: Chess;
    myColor: 'w' | 'b';
    setPromotion: (from: string, to: string) => void;
    checkSquare: String | null;
};

const ChessBoard: React.FC<ChessBoardProps> = ({ board, socket, setBoard, chess, setPromotion, checkSquare, myColor }) => {
    const [from, setFrom] = useState<null | Square>(null);

    return (
        <div className={`relative ${myColor === 'b' ? 'flipped' : ''}`}>
            <div className='grid grid-cols-8 grid-rows-8 w-[480px] h-[480px] relative'>
                {board.flat().map((square, index) => {
                    const i = Math.floor(index / 8);
                    const j = index % 8;
                    const squareRepresentation = String.fromCharCode(97 + (j % 8)) + '' + (8 - i) as Square;

                    const isKingInCheck = squareRepresentation === checkSquare;

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
                        const moves = chess.moves({ square: fromSquare, verbose: true });
                        const isPromotion = moves.some(
                            (move: any) => move.flags.includes('p') && move.to === toSquare
                        );

                        if (isPromotion) {
                            setPromotion(fromSquare, toSquare); // Trigger promotion selection
                        } else {
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
                        }
                    };

                    return (
                        <div
                            key={index}
                            ref={dropRef}
                            onClick={() => {
                                if (!from) {
                                    setFrom(squareRepresentation); // Set the piece to move
                                } else {
                                    handleMove(from, squareRepresentation); // Handle the move
                                }
                            }}
                            className={`w-full h-full flex items-center justify-center ${(i + j) % 2 === 0 ? 'bg-[#ebecd0]' : 'bg-[#779556]'
                                } ${isKingInCheck ? 'bg-red-500' : ''} ${isOver ? 'bg-yellow-300' : ''}`}
                        >
                            <div className={`${myColor === 'b' ? 'flipped' : ''}`}>
                                {square ? (
                                    <ChessPiece
                                        square={square}
                                        from={squareRepresentation}
                                        setFrom={setFrom}
                                    />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
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

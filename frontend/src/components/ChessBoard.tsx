import { Square, PieceSymbol, Color, Chess } from 'chess.js';
import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { MOVE } from '../screens/Game';
import LegalMoveIndicator from './LegalMoveIndicator'; // Import the LegalMoveIndicator component

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
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);

    // Calculate legal moves when a piece is selected
    const calculateLegalMoves = (fromSquare: Square) => {
        const moves = chess.moves({ square: fromSquare, verbose: true });
        const legalSquares = moves.map((move: any) => move.to);
        console.log("Legal Moves:", legalSquares); // Debugging
        setLegalMoves(legalSquares);
    };

    // Handle piece selection and deselection
    const handlePieceSelection = (squareRepresentation: Square) => {
        if (from === squareRepresentation) {
            // Deselect the piece if the same square is clicked again
            setFrom(null);
            setLegalMoves([]);
        } else if (from) {
            // If a piece is already selected, attempt to move it to the clicked square
            if (legalMoves.includes(squareRepresentation)) {
                handleMove(from, squareRepresentation);
            } else {
                // If the clicked square is not a legal move, select the new piece (if it exists)
                const clickedPiece = board.flat().find(sq => sq?.square === squareRepresentation);
                if (clickedPiece) {
                    setFrom(squareRepresentation);
                    calculateLegalMoves(squareRepresentation);
                }
            }
        } else {
            // If no piece is selected, select the new one (if it exists)
            const clickedPiece = board.flat().find(sq => sq?.square === squareRepresentation);
            if (clickedPiece) {
                setFrom(squareRepresentation);
                calculateLegalMoves(squareRepresentation);
            }
        }
    };

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
                setLegalMoves([]); // Clear legal moves
            }
        }
    };

    // Ranks and files based on player perspective
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    return (
        <div className={`relative ${myColor === 'b' ? 'flipped' : ''}`}>
            {/* Chessboard */}
            <div className='grid grid-cols-8 grid-rows-8 w-[330px] h-[330px] md:w-[700px] md:h-[700px] relative'>
                {board.flat().map((square, index) => {
                    const i = Math.floor(index / 8);
                    const j = index % 8;
                    const squareRepresentation = String.fromCharCode(97 + (j % 8)) + '' + (8 - i) as Square;

                    const isKingInCheck = squareRepresentation === checkSquare;
                    const isLegalMove = legalMoves.includes(squareRepresentation);

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

                    return (
                        <div
                            key={index}
                            ref={dropRef}
                            onClick={() => handlePieceSelection(squareRepresentation)}
                            className={`w-full h-full flex items-center justify-center relative ${(i + j) % 2 === 0 ? 'bg-[#ebecd0]' : 'bg-[#779556]'
                                } ${isKingInCheck ? 'bg-red-500' : ''} ${isOver ? 'bg-yellow-300' : ''}`}
                        >
                            {/* Ranks (numbers on the left) */}
                            {myColor === 'w' && j === 0 && (
                                <div
                                    className={`absolute left-1 top-1 text-sm font-medium ${(i + j) % 2 === 0 ? 'text-[#779556]' : 'text-[#ebecd0]'}`}
                                >
                                    {ranks[i]}
                                </div>
                            )}

                            {/* Files (letters at the bottom) */}
                            {myColor === 'w' && i === 7 && (
                                <div
                                    className={`absolute right-1 bottom-1 text-sm font-medium ${(i + j) % 2 === 0 ? 'text-[#779556]' : 'text-[#ebecd0]'}`}
                                >
                                    {files[j]}
                                </div>
                            )}

                            {/* Ranks (numbers on the right for black) */}
                            {myColor === 'b' && j === 7 && (
                                <div
                                    className={`flipped absolute right-1 bottom-1 text-sm font-medium ${(i + j) % 2 === 0 ? 'text-[#779556]' : 'text-[#ebecd0]'}`}
                                >
                                    {ranks[i]}
                                </div>
                            )}

                            {/* Files (letters at the top for black) */}
                            {myColor === 'b' && i === 0 && (
                                <div
                                    className={`flipped absolute left-1 top-1 text-sm font-medium ${(i + j) % 2 === 0 ? 'text-[#779556]' : 'text-[#ebecd0]'}`}
                                >
                                    {files[j]}
                                </div>
                            )}

                            {/* Chess piece and legal move indicator */}
                            <div className={`${myColor === 'b' ? 'flipped' : ''}`}>
                                {square ? (
                                    <ChessPiece
                                        square={square}
                                        from={squareRepresentation}
                                        setFrom={setFrom}
                                    />
                                ) : null}
                                {isLegalMove && (
                                    <LegalMoveIndicator
                                        isPiece={!!square}
                                        isMainBoxColor={(i + j) % 2 === 0}
                                    />
                                )}
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
            className="w-[5.25rem] cursor-pointer"
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

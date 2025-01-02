interface GameOverProps {
    winner: string | null;
}

const GameOver: React.FC<GameOverProps> = ({ winner }) => {
    // Refresh the page
    const handleRestart = () => {
        window.location.reload();
    };

    return (
        <dialog open className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-white text-black p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <p className="text-lg mb-6">
                    {winner ? `${winner} Wins!` : "It's a Draw!"}
                </p>
                <button
                    onClick={handleRestart}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition duration-300"
                >
                    Play Again
                </button>
            </div>
        </dialog>
    );
};

export default GameOver;

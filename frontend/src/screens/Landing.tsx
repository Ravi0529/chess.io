import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const Landing: React.FC = () => {

    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 text-white p-4">
            <div className="flex-1 flex justify-center mb-6 md:mb-0">
                <div className="rounded-lg overflow-hidden shadow-lg">
                    <img
                        src={"/chessBoard.webp"}
                        alt="chessBoard"
                        className="w-80 h-80 mt-9 md:mt-0 md:w-96 md:h-96 object-cover"
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-6">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Welcome to Chess.io</h1>
                    <p className="text-lg text-gray-400 max-w-md">
                        Dive into the world of Chess.io. Challenge yourself and improve your skills.
                    </p>
                </div>
                <div>
                    <Button disabled={false} onClick={() => navigate("/game")}>
                        Play
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Landing;

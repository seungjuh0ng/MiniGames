import { useParams } from "react-router-dom";
import SampleGame from "../games/SampleGame";
import Game2048 from "../games/Game2048";
const GamePage = () => {
  const { gameId } = useParams();
  console.log(gameId);
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="w-full max-w-3xl h-full flex items-center justify-center">
        {gameId === "sample" && <SampleGame />}
        {gameId === "2048" && <Game2048 />}
        {gameId !== "sample" && gameId !== "2048" && (
          <p className="text-lg text-gray-500">존재하지 않는 게임 ID입니다.</p>
        )}
      </div>
    </div>
  );
};

export default GamePage;

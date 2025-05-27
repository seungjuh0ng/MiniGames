import GameCard from "../components/GameCard";

const games = [
  { id: "2048", name: "2048", description: "2048 게임입니다." },
  // 추후 게임 추가 가능
];

const MainPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 drop-shadow-lg">
        Mini Games
      </h1>
      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-fr">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
};

export default MainPage;

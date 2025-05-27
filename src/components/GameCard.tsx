import React from "react";
import { Link } from "react-router-dom";

interface GameCardProps {
  id: string;
  name: string;
  description: string;
}

const GameCard: React.FC<GameCardProps> = ({ id, name }) => {
  return (
    <Link
      to={`/game/${id}`}
      className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-200 border border-transparent hover:border-blue-400 group aspect-square w-full h-full"
    >
      <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
        <h2 className="text-4xl font-bold text-blue-700 group-hover:text-purple-600 mb-2  ">
          {name}
        </h2>
      </div>
    </Link>
  );
};

export default GameCard;

import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { v4 as uuidv4 } from "uuid";
import { useSpring, a } from "@react-spring/three";
import ReplayIcon from "@mui/icons-material/Replay";
import HomeFilledIcon from "@mui/icons-material/HomeFilled";
import { useNavigate } from "react-router-dom";
// 3D 그리드 컴포넌트 (파일 내 분리)
const GRID_SIZE = 4;
const CELL_SIZE = 1.2;
const CELL_GAP = 0.12;
const GRID_COLOR = "#bdbdbd";

function getTileColor(value: number): string {
  const colors: { [key: number]: string } = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };
  return colors[value] || "#3c3a32";
}

function Grid3D() {
  return (
    <group>
      {/* 바닥판 */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry
          args={[
            GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP,
            0.2,
            GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP,
          ]}
        />
        <meshStandardMaterial color={GRID_COLOR} />
      </mesh>
      {/* 셀 구분선 */}
      {Array.from({ length: GRID_SIZE }).map((_, row) =>
        Array.from({ length: GRID_SIZE }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[
              (col - (GRID_SIZE - 1) / 2) * (CELL_SIZE + CELL_GAP),
              -0.1,
              (row - (GRID_SIZE - 1) / 2) * (CELL_SIZE + CELL_GAP),
            ]}
          >
            <boxGeometry args={[CELL_SIZE, 0.22, CELL_SIZE]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
        ))
      )}
    </group>
  );
}

// 3D 타일 컴포넌트 (파일 내 분리)
function Tile3D({ row, col, value, new: isNew, merging, isMergedResult }: any) {
  const { pos, scale } = useSpring({
    pos: [
      (col - (GRID_SIZE - 1) / 2) * (CELL_SIZE + CELL_GAP),
      0.25,
      (row - (GRID_SIZE - 1) / 2) * (CELL_SIZE + CELL_GAP),
    ],
    scale:
      merging || isMergedResult
        ? [1.2, 1.2, 1.2]
        : isNew
        ? [0.8, 0.8, 0.8]
        : [1, 1, 1],
    config: { tension: 300, friction: 30 },
  });
  return (
    <a.group position={pos.to((x: number, y: number, z: number) => [x, y, z])}>
      <mesh castShadow>
        <boxGeometry args={[CELL_SIZE, 0.4, CELL_SIZE, 4, 1, 4]} />
        <meshStandardMaterial
          color={getTileColor(value)}
          metalness={0.3}
          roughness={0.4}
          envMapIntensity={1}
        />
      </mesh>
      <Text
        position={[0, 0.25, 0]}
        fontSize={CELL_SIZE * 0.35}
        color="#ffffff"
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {value}
      </Text>
    </a.group>
  );
}

// 카메라를 수직(top-down)으로 고정하는 헬퍼 컴포넌트
function TopDownCamera() {
  const { camera } = useThree();
  React.useEffect(() => {
    camera.position.set(0, 10, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// 타일 엔티티 타입
interface TileEntity {
  id: string;
  value: number;
  pos: [number, number]; // 현재 위치
  targetPos: [number, number]; // 목표 위치
  isMerging: boolean;
  isNew: boolean;
  isRemoving: boolean;
  mergeTo?: string;
}

// 2048 게임 상태 초기화 (엔티티 기반)
function getInitialState() {
  const board: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  const tiles: TileEntity[] = [];
  let empty: [number, number][] = [];
  for (let z = 0; z < GRID_SIZE; z++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      empty.push([x, z]);
    }
  }
  // 한 개의 타일만 생성
  const [x1, z1] = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
  const id1 = uuidv4();
  board[z1][x1] = id1;
  tiles.push({
    id: id1,
    value: Math.random() < 0.9 ? 2 : 4,
    pos: [x1, z1],
    targetPos: [x1, z1],
    isMerging: false,
    isNew: true,
    isRemoving: false,
  });
  return { board, tiles };
}

function isGameOver(tiles: any[]): boolean {
  if (getEmptyCells(tiles).length > 0) return false;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = tiles.find((t: any) => t.row === row && t.col === col);
      if (!tile) continue;
      // Check right
      const right = tiles.find((t: any) => t.row === row && t.col === col + 1);
      if (right && right.value === tile.value) return false;
      // Check down
      const down = tiles.find((t: any) => t.row === row + 1 && t.col === col);
      if (down && down.value === tile.value) return false;
    }
  }
  return true;
}

function createTile(row: number, col: number, value = 2) {
  return {
    id: uuidv4(),
    value,
    row,
    col,
    new: true,
  };
}

function getEmptyCells(tiles: any[]): { row: number; col: number }[] {
  const occupied = tiles.map((t: any) => `${t.row}-${t.col}`);
  const empty = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupied.includes(`${row}-${col}`)) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

function Game2048() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<any[]>([]);
  const [moving, setMoving] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);

  const resetGame = () => {
    const initial = [];
    const empties = getEmptyCells([]);
    const first = empties.splice(
      Math.floor(Math.random() * empties.length),
      1
    )[0];
    const second = empties.splice(
      Math.floor(Math.random() * empties.length),
      1
    )[0];
    initial.push(createTile(first.row, first.col));
    initial.push(createTile(second.row, second.col));
    setTiles(initial);
    scoreRef.current = 0;
    setGameOver(false);
  };

  useEffect(() => {
    // Load best score from localStorage
    const savedBestScore = localStorage.getItem("bestScore");
    if (savedBestScore) {
      bestScoreRef.current = parseInt(savedBestScore);
    }
    const initial = [];
    const empties = getEmptyCells([]);
    const first = empties.splice(
      Math.floor(Math.random() * empties.length),
      1
    )[0];
    const second = empties.splice(
      Math.floor(Math.random() * empties.length),
      1
    )[0];
    initial.push(createTile(first.row, first.col));
    initial.push(createTile(second.row, second.col));
    setTiles(initial);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (moving || gameOver) return;
      let direction: any = null;
      if (e.key === "ArrowUp") direction = "up";
      if (e.key === "ArrowDown") direction = "down";
      if (e.key === "ArrowLeft") direction = "left";
      if (e.key === "ArrowRight") direction = "right";
      if (direction) {
        e.preventDefault();
        moveTiles(direction);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tiles, moving, gameOver]);

  // 터치 이벤트 핸들러 추가
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isTouching = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (moving || gameOver) return;
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    };
    const handleTouchEnd = () => {
      if (!isTouching) return;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; // 최소 스와이프 거리
      let direction = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }
      moveTiles(direction);
      isTouching = false;
    };
    const board = document.getElementById("game-board-touch-area");
    if (board) {
      board.addEventListener("touchstart", handleTouchStart, { passive: false });
      board.addEventListener("touchmove", handleTouchMove, { passive: false });
      board.addEventListener("touchend", handleTouchEnd, { passive: false });
    }
    return () => {
      if (board) {
        board.removeEventListener("touchstart", handleTouchStart);
        board.removeEventListener("touchmove", handleTouchMove);
        board.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [tiles, moving, gameOver]);

  function moveTiles(direction: any) {
    setMoving(true);
    const moved = [...tiles].map((t: any) => ({
      ...t,
      new: false,
      prevRow: t.row,
      prevCol: t.col,
    }));
    const mergedMap: Record<string, boolean> = {};
    let hasMoved = false;
    const traverse = getTraversalOrder(direction);
    for (let i = 0; i < traverse.length; i++) {
      const { row, col } = traverse[i];
      const tile = moved.find((t: any) => t.row === row && t.col === col);
      if (!tile) continue;
      let [targetRow, targetCol] = [tile.row, tile.col];
      while (true) {
        const nextRow =
          targetRow + (direction === "down" ? 1 : direction === "up" ? -1 : 0);
        const nextCol =
          targetCol +
          (direction === "right" ? 1 : direction === "left" ? -1 : 0);
        const nextTile = moved.find(
          (t: any) => t.row === nextRow && t.col === nextCol
        );
        if (
          nextRow < 0 ||
          nextRow >= GRID_SIZE ||
          nextCol < 0 ||
          nextCol >= GRID_SIZE
        )
          break;
        if (!nextTile) {
          targetRow = nextRow;
          targetCol = nextCol;
        } else if (
          nextTile.value === tile.value &&
          !mergedMap[`${nextRow}-${nextCol}`]
        ) {
          targetRow = nextRow;
          targetCol = nextCol;
          mergedMap[`${nextRow}-${nextCol}`] = true;
          break;
        } else {
          break;
        }
      }
      if (targetRow !== tile.row || targetCol !== tile.col) {
        hasMoved = true;
        tile.row = targetRow;
        tile.col = targetCol;
        if (mergedMap[`${targetRow}-${targetCol}`]) {
          tile.merging = true;
        }
      }
    }
    setTiles(moved);
    setTimeout(() => {
      const afterMerge: any[] = [];
      const mergedValueMap: Record<string, number> = {};
      moved.forEach((tile: any) => {
        const key = `${tile.row}-${tile.col}`;
        if (tile.merging) {
          if (!mergedValueMap[key]) {
            mergedValueMap[key] = tile.value * 2;
            afterMerge.push({
              ...createTile(tile.row, tile.col, tile.value * 2),
              isMergedResult: true,
            });
            const newScore = scoreRef.current + tile.value * 2;
            scoreRef.current = newScore;
            if (newScore > bestScoreRef.current) {
              bestScoreRef.current = newScore;
              localStorage.setItem("bestScore", newScore.toString());
            }
          }
        } else {
          if (!mergedMap[key]) {
            afterMerge.push(tile);
          }
        }
      });
      const newTiles: any[] = [...afterMerge];
      if (hasMoved) {
        const empties = getEmptyCells(newTiles);
        if (empties.length) {
          const rand = empties[Math.floor(Math.random() * empties.length)];
          newTiles.push(createTile(rand.row, rand.col));
        }
      }
      setTiles(newTiles);
      setMoving(false);
      if (isGameOver(newTiles)) {
        setGameOver(true);
      }
    }, 200);
  }

  function getTraversalOrder(direction: any) {
    const order = [];
    const range = [...Array(GRID_SIZE).keys()];
    const rowIter =
      direction === "up"
        ? range
        : direction === "down"
        ? [...range].reverse()
        : range;
    const colIter =
      direction === "left"
        ? range
        : direction === "right"
        ? [...range].reverse()
        : range;
    for (let row of rowIter) {
      for (let col of colIter) {
        order.push({ row, col });
      }
    }
    return order;
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      {/* 2D 오버레이 UI */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2 z-10">
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base text-[#2c3e50] opacity-70 font-mono">
            <span>SCORE: </span>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#2c3e50]">
              {scoreRef.current}
            </span>
          </span>
          <span className="flex items-center gap-2 text-xs sm:text-sm md:text-base text-[#2c3e50] opacity-70 font-mono">
            <span>BEST: </span>
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#2c3e50]">
              {bestScoreRef.current}
            </span>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetGame}
            className="px-2 py-2 text-[#2c3e50] border-2 border-[#2c3e50] rounded-lg hover:bg-[#2c3e50] hover:text-white transition-colors font-mono text-xs sm:text-sm md:text-base flex items-center justify-center"
            aria-label="Restart Game"
          >
            <ReplayIcon />
          </button>
          <button
            onClick={() => {
              navigate("/");
            }}
            className="px-2 py-2 text-[#2c3e50] border-2 border-[#2c3e50] rounded-lg hover:bg-[#2c3e50] hover:text-white transition-colors font-mono text-xs sm:text-sm md:text-base flex items-center justify-center"
            aria-label="Restart Game"
          >
            <HomeFilledIcon />
          </button>
        </div>
      </div>
      {/* 3D 보드 */}
      <div id="game-board-touch-area" className="fixed w-full h-full touch-none">
        <Canvas camera={{ fov: 60 }} shadows>
          <TopDownCamera />
          {/* <ambientLight intensity={1} /> */}
          <directionalLight position={[0, 10, 0]} intensity={1} castShadow />
          <Grid3D />
          {tiles.map((tile) => (
            <Tile3D key={tile.id} {...tile} />
          ))}
        </Canvas>
        {gameOver && (
          <div className="absolute inset-0 bg-white/50 rounded-lg flex flex-col items-center justify-center gap-4 z-20">
            <div className="text-2xl font-bold text-blue-900">Game Over!</div>
            <div className="text-lg text-blue-700">
              Score: {scoreRef.current}
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Game2048;

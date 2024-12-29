import React, { useState, useEffect } from "react";
import "./TicTacToe.css";

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [winningSquares, setWinningSquares] = useState([]);
  const [gameId, setGameId] = useState(null);

  const [clickSound] = useState(new Audio('/sounds/click.mp3'));
  const [winSound] = useState(new Audio('/sounds/win.mp3'));
  const [drawSound] = useState(new Audio('/sounds/draw.mp3'));

  // First, try to load existing game on component mount
  useEffect(() => {
    fetchLatestGame();
  }, []);

  const fetchLatestGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/games/latest');
      const data = await response.json();
      
      if (data && data.id) {
        // If game exists, load it
        setBoard(data.board);
        setIsXNext(data.is_x_next);
        setWinner(data.winner || null);
        setWinningSquares(data.winning_squares || []);
        setGameId(data.id);
      } else {
        // If no game exists, create new one
        createNewGame();
      }
    } catch (error) {
      console.error('Error fetching game:', error);
      createNewGame(); // Fallback to new game if fetch fails
    }
  };

  const createNewGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: Array(9).fill(null),
          isXNext: true,
          winner: null,
          winningSquares: [],
        }),
      });
      const data = await response.json();
      setGameId(data.id);
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
      setWinningSquares([]);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const updateGameState = async (newBoard, newIsXNext, newWinner, newWinningSquares) => {
    if (!gameId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: newBoard,
          isXNext: newIsXNext,
          winner: newWinner,
          winningSquares: newWinningSquares,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update game state');
      }
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleClick = async (index) => {
    if (board[index] || winner) return;

    clickSound.play();

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    
    // Update local state
    setBoard(newBoard);
    setIsXNext(!isXNext);

    // Check for winner
    const winResult = checkWinner(newBoard);
    const newWinner = winResult ? winResult.winner : null;
    const newWinningSquares = winResult ? winResult.squares : [];

    // Important: Wait for the state update to complete
    await updateGameState(newBoard, !isXNext, newWinner, newWinningSquares);
  };

  const checkWinner = (currentBoard) => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (let combo of winningCombinations) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        setWinner(currentBoard[a]);
        setWinningSquares([a, b, c]);
        winSound.play();
        return { winner: currentBoard[a], squares: [a, b, c] };
      }
    }

    if (!currentBoard.includes(null)) {
      setWinner("Draw");
      drawSound.play();
      return { winner: "Draw", squares: [] };
    }

    return null;
  };

  const resetGame = () => {
    createNewGame();
  };

  return (
    <div className="game">
      <h1>Tic-Tac-Toe</h1>
      <h2>
        {winner
          ? winner === "Draw"
            ? "It's a Draw!"
            : `${winner} Wins!`
          : board.every((square) => square === null)
          ? "Game Started!"
          : `Next turn: ${isXNext ? "X" : "O"}`}
      </h2>
      <div className="board">
        {board.map((square, index) => (
          <div
            key={index}
            className={`square ${winningSquares.includes(index) ? "winning" : ""} ${square === "X" ? "x" : square === "O" ? "o" : ""}`}
            onClick={() => handleClick(index)}
          >
            {square}
          </div>
        ))}
      </div>
      <button onClick={resetGame}>Restart</button>
    </div>
  );
}

export default TicTacToe;
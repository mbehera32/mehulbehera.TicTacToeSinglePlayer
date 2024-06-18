import { MouseEvent, useEffect, useState } from "react";
import "./App.css";

const emptyBoard: string[] = ["", "", "", "", "", "", "", "", ""];

interface winnerOutput {
  //X, O, null
  winningPiece: string | null;

  //Win, Draw, null
  winningOutcome: string | null;
}

export function checkWinState(b: typeof emptyBoard): winnerOutput {
  //all possible winning positions
  const possibleWinnerCoords = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < 8; i++) {
    //[0,1,2]
    const winningCoords = possibleWinnerCoords[i];
    if (
      b[winningCoords[0]] === b[winningCoords[1]] &&
      b[winningCoords[0]] === b[winningCoords[2]] &&
      b[winningCoords[0]] !== ""
    ) {
      //someone won
      //gets X or O
      const winningPiece = b[winningCoords[0]];
      const winningOutcome = "WIN";

      return { winningPiece, winningOutcome };
    }
  }

  //no one  won
  const winningPiece = null;
  let winningOutcome = null;

  for (let i = 0; i < 9; i++) {
    if (b[i] === "") {
      //games unfinished
      return { winningPiece, winningOutcome };
    }
  }

  //final outcome: TIE
  winningOutcome = "TIE";

  return { winningPiece, winningOutcome };
}

function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState("");
  const [singlePlayer, setSinglePlayer] = useState(false);

  //numWins: {X Wins: 0, Ties, O Wins}
  const [numXWins, setXWins] = useState(0);
  const [numOWins, setOWins] = useState(0);
  const [numTies, setTies] = useState(0);

  //progress
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentPlayer === "O" && winner === "" && singlePlayer === false) {
      const index = getOpponentMove(board, currentPlayer);
      setPieceOnBoard(index);
    }
  }, [board]);

  const togglePlayer = () => {
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
  };

  function setPieceOnBoard(index: number) {
    let newBoard = [...board];

    if (newBoard[index] === "") {
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      //switch players - for 2 players
      togglePlayer();
      setProgress(progress + 1 / 9);

      const output = checkWinState(newBoard);

      const winningOutcome = output.winningOutcome;
      const winningPiece = output.winningPiece;

      //if won - ADD STOP PLAYERS FROM WINNING
      if (winningOutcome === "WIN") {
        (
          document.getElementById("winner_modal")! as HTMLDialogElement
        ).showModal();
        setProgress(1);
        setWinner(winningPiece + "    WINS");
        if (winningPiece === "X") {
          setXWins(numXWins + 1);
        } else {
          setOWins(numOWins + 1);
        }
      } else if (winningOutcome === "TIE") {
        (
          document.getElementById("winner_modal")! as HTMLDialogElement
        ).showModal();
        setProgress(1);
        setWinner("TIE");
        setTies(numTies + 1);
      }
    }
  }

  //params: board, depth(how many layers deep), maxmize (boolean whether or not to max), player ("X"|"O")
  //returns score of a board in a terminal case
  function minMax(
    boardToMinMax: typeof board,
    depth: number,
    maximize: boolean,
    player: string
  ): number {
    //Base Case: If game is in terminal state evaluate board and return a score
    const output = checkWinState(boardToMinMax);

    const winningOutcome = output.winningOutcome;
    const winningPiece = output.winningPiece;

    if (winningOutcome !== null) {
      if (winningOutcome === "WIN") {
        //player wins - return a positive score based on how many layers deep they win
        if (winningPiece === player) {
          return 10 - depth;
        }
        //opponent wins - return a negative score based on how many layers deep
        else {
          return depth - 10;
        }
      }
      //if a tie - return 0
      if (winningOutcome === "TIE") {
        return 0;
      }
    }

    //Recursive Function

    //set opponent
    const opponent = player === "X" ? "O" : "X";

    //maximizing half
    if (maximize) {
      let bestScore = -Infinity;

      //for all empty spots on board
      for (let i = 0; i < boardToMinMax.length; i++) {
        if (boardToMinMax[i] === "") {
          //set piece on potential board
          const newBoard = [...boardToMinMax];
          newBoard[i] = opponent;

          //get minMaxScore on potential board
          const score = minMax(newBoard, depth + 1, false, player);
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    }
    //minimizing half
    else {
      let bestScore = Infinity;

      //get all potential boards from empty spots
      for (let i = 0; i < boardToMinMax.length; i++) {
        if (boardToMinMax[i] === "") {
          const newBoard = [...boardToMinMax];
          newBoard[i] = player;

          const score = minMax(newBoard, depth + 1, true, player);
          bestScore = Math.min(score, bestScore);
        }
      }

      return bestScore;
    }
  }

  //params: Takes in current board and current player(opponent)
  //returns: index of best Move
  function getOpponentMove(boardToMoveOn: string[], player: string): number {
    let scores: { score: number; index: number }[] = [];
    //get the scores of all potential terminal states based on params
    for (let i = 0; i < boardToMoveOn.length; i++) {
      if (boardToMoveOn[i] === "") {
        const potentialBoard = [...boardToMoveOn];
        potentialBoard[i] = player;
        const scoreFromMinMax = minMax(potentialBoard, 0, true, player);
        scores.push({ score: scoreFromMinMax, index: i });
      }
    }

    //get the index of the highest score - best move
    let maxIndex = -1;
    let maxScore = -Infinity;

    for (let i = 0; i < scores.length; i++) {
      const scoreToEval = scores[i].score;
      const indexToEval = scores[i].index;

      if (maxScore < scoreToEval) {
        maxScore = scoreToEval;
        maxIndex = indexToEval;
      }
    }

    return maxIndex;
  }

  function handlePress(e: MouseEvent<HTMLButtonElement>) {
    const buttonID = parseInt(e.currentTarget.id);
    //add user piece
    setPieceOnBoard(buttonID);
  }

  const hasWon = winner !== "";

  //let bgColor = "bg-gray-200";

  function getWinner(): { winningPiece: string; winningCoords: number[] } {
    //all possible winning positions
    const possibleWinnerCoords = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < 8; i++) {
      const winningCoords = possibleWinnerCoords[i];
      if (
        board[winningCoords[0]] === board[winningCoords[1]] &&
        board[winningCoords[0]] === board[winningCoords[2]] &&
        board[winningCoords[0]] !== ""
      ) {
        //someone won
        //gets X or O
        const winningPiece = board[winningCoords[0]];

        return {
          winningPiece: winningPiece,
          winningCoords: [winningCoords[0], winningCoords[1], winningCoords[2]],
        };
      }
    }

    return { winningPiece: "none", winningCoords: [0, 1, 2] };
  }

  function bgColor(elementInSquare: string, index: number): string {
    if (winner) {
      const output = getWinner();
      const winningCoords = output.winningCoords;
      const winningPiece = output.winningPiece;

      if (winningCoords.includes(index)) {
        if (winningPiece === "X") {
          return "bg-blue-300 hover:bg-blue-400 disabled:bg-green-300";
        } else if (winningPiece === "O") {
          return "bg-red-300 hover:bg-red-400 disabled:bg-green-300";
        }
      }
    }

    if (elementInSquare === "X") {
      return "bg-blue-300 hover:bg-blue-400 disabled:bg-blue-400";
    } else if (elementInSquare === "O") {
      return "bg-red-300 hover:bg-red-400 disabled:bg-red-400";
    }

    return "bg-gray-200 hover:bg-gray-300 disabled:bg-gray-400";
  }

  return (
    <>
      <div className="flex flex-row gap-5">
        <div>
          <section className="grid grid-cols-3 gap-1 max-w-2xl aspect-square place-items-center">
            {board.map((tile, index) => (
              <button
                className={
                  " btn border border-black disabled:border disabled:border-black h-full w-full btn-lg text-7xl  disabled:text-black text-black " +
                  bgColor(board[index], index)
                }
                id={index.toString()}
                disabled={hasWon}
                onClick={(e) => {
                  handlePress(e), console.log(tile);
                }}
              >
                {board[index]}
              </button>
            ))}
          </section>

          <section className="grid grid-cols-3 gap-1 max-w-2xl place-items-center">
            <button
              className="btn m-2 bg-gray-200 hover:bg-gray-200 disabled:bg-gray-200 btn-lg w-44  text-black disabled:text-black "
              id="XWinButton"
              disabled={hasWon}
            >
              X Won: {numXWins}
            </button>
            <button
              className="btn m-2 bg-gray-200 hover:bg-gray-200 disabled:bg-gray-200 btn-lg w-44  text-black disabled:text-black "
              id="Tie"
              disabled={hasWon}
            >
              Ties: {numTies}
            </button>
            <button
              className="btn m-2 bg-gray-200 hover:bg-gray-200 disabled:bg-gray-200 btn-lg w-44  text-black disabled:text-black "
              id="OWinButton"
              disabled={hasWon}
            >
              O Won: {numOWins}
            </button>
          </section>
          <div>
            <progress className="progress w-56" value={progress}></progress>
          </div>
        </div>

        <div className="flex flex-col">
          <button
            className="btn m-2 btn-info btn-lg w-44 hover:bg-gray-300 bg-gray-200"
            onClick={() => {
              setBoard(emptyBoard),
                setWinner(""),
                setCurrentPlayer("X"),
                setProgress(0);
            }}
          >
            {!winner ? "Reset" : "Next Game"}
          </button>

          <label className="swap swap-flip text-9xl">
            <input
              type="checkbox"
              onClick={() => setSinglePlayer(!singlePlayer)}
            />

            <div className="swap-on">🙋🏾‍♂️</div>
            <div className="swap-off">🤖</div>
          </label>
        </div>
      </div>

      <dialog id="winner_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">WINNER!</h3>
          <p className="py-4">{winner} won the game!</p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}

export default App;

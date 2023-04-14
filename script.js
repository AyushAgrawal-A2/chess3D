import { create3DBoard, create3DPlane, getClickedPosition } from "./src/3d.js";

import {
  DEFAULT_BOARD,
  TURN_NAME,
  PAWN_PROMOTION,
} from "./src/chessConstants.js";

import {
  select,
  deselect,
  move,
  checkKing,
  canPlayerMove,
  getKing,
  undoMove,
  promotePawn,
} from "./src/chessLogic.js";

let board,
  turn,
  captured,
  selected,
  history,
  check,
  canMove,
  gameStatus,
  waitForPromotion;

let board3D, plane3D;

window.addEventListener("click", onClick);

resetGame();

function onClick(event) {
  const cellXY = getClickedPosition(event);
  if (cellXY) handleBoardClick(board3D, cellXY);
}

function handleBoardClick(board3D, cellXY) {
  // if pawn need to be promoted
  // if(waitForPromotion)

  // if no piece is selected, select this piece and highlight valid moves / attacks
  if (!selected) selected = select(board, turn, cellXY, history, plane3D);
  // if already a piece is selected, either make a move to this cell or deselect the previous piece.
  else {
    const cell = board[cellXY.x][cellXY.y];
    // if same piece is clicked, deselect the piece
    if (selected.x === cellXY.x && selected.y === cellXY.y) {
      selected = deselect(board, plane3D);
    }
    // if a valid move / attack is selected make the move
    else if (cell.validMove || cell.validAttack) {
      if (cell.validAttack) {
        captured[turn].push(
          cell.name !== "" ? cell.name : TURN_NAME[turn ^ 1] + "_PAWN"
        );
      }
      // if move is complete change turn, else pawn needs to be promoted
      if (move(board, selected, cellXY, history, board3D)) {
        turn ^= 1;
        selected = deselect(board, plane3D);
        // displayGameStatus();
      }
      // change pawn promotion flag and display modal
      else {
        waitForPromotion = true;
        selected = select(board, turn, cellXY, history, plane3D);
      }
    }
    // if any other piece is clicked, select this piece
    else selected = select(board, turn, cellXY, history, plane3D);
  }
  // displayBoard();
}

async function resetGame() {
  // make a new board from DEFAULT_BOARD
  board = DEFAULT_BOARD.map((row) =>
    row.map((cell) => ({
      name: cell,
      color: cell.split("_")[0] ?? null,
      type: cell.split("_")[1] ?? null,
      moved: false,
      selected: false,
      validMove: false,
      validAttack: false,
    }))
  );

  board3D = await create3DBoard(board);
  plane3D = create3DPlane(board);

  turn = 0; // white will move first
  waitForPromotion = false;
  captured = [[], []];
  selected = null;
  history = [];
}

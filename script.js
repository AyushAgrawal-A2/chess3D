import { PIECE, getMove, parseLocation } from "./src/botLogic.js";
import {
  create3DBoard,
  create3DPlane,
  getClickedPosition,
  getClickedModalName,
  displayModal,
  removeModal,
  promotePawn3D,
} from "./src/3d.js";

import { DEFAULT_BOARD, TURN_NAME } from "./src/chessConstants.js";

import {
  select,
  deselect,
  move,
  checkKing,
  canPlayerMove,
  getKing,
  undoMove,
  promotePawn2D,
} from "./src/chessLogic.js";

let board,
  turn,
  bot,
  captured,
  selected,
  history,
  check,
  canMove,
  gameStatus,
  waitForPromotion;

let board3D, plane3D;

const audioElements = document.querySelectorAll("audio");

window.addEventListener("click", onClick);

resetGame();

// user interactions
function onClick(event) {
  if (waitForPromotion) {
    const name = getClickedModalName(event);
    promotePawn(name);
  } else {
    const cellXY = getClickedPosition(event);
    handleBoardClick(cellXY);
  }
}

function handleBoardClick(cellXY) {
  if (turn === bot) return;

  if (!cellXY) return;

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
      executeMove(cellXY);
    }
    // if any other piece is clicked, select this piece
    else selected = select(board, turn, cellXY, history, plane3D);
  }
  displayGameStatus();
}

function executeMove(target) {
  const targetElement = board[target.x][target.y];
  if (targetElement.validAttack) {
    captured[turn].push(
      targetElement.name !== ""
        ? targetElement.name
        : TURN_NAME[turn ^ 1] + "_PAWN"
    );
    audioElements[1].play();
  }

  // if move is complete change turn, else pawn needs to be promoted
  if (move(board, selected, target, history, board3D)) {
    changeTurn();
    calculateGameStatus();
    if (!targetElement.validAttack) audioElements[0].play();
  }
  // change pawn promotion flag and display modal
  else {
    displayModal(turn);
    waitForPromotion = true;
    selected = select(board, turn, target, history, plane3D);
  }
}

// bot simulated interactions
function botMove() {
  if (turn !== bot) return;
  const nextMove = getMove(board, turn, history);
  const source = parseLocation(nextMove.from);
  selected = select(board, turn, source, history, plane3D);
  const target = parseLocation(nextMove.to);
  executeMove(target);
  if (nextMove.promotion) {
    const name = TURN_NAME[turn] + "_" + PIECE[nextMove.promotion];
    promotePawn(name);
  }
  displayGameStatus();
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
  bot = Math.floor(Math.random() * 2);
  waitForPromotion = false;
  captured = [[], []];
  selected = null;
  history = [];
  calculateGameStatus();
  displayGameStatus();
}

function promotePawn(name) {
  if (!name) return;
  promotePawn2D(board, selected, name);
  promotePawn3D(board3D, selected, name);
  removeModal(turn);
  waitForPromotion = false;
  changeTurn();
  audioElements[0].play();
  calculateGameStatus();
}

function calculateGameStatus() {
  check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });
  canMove = canPlayerMove(board, turn, history);

  if (turn) gameStatus = "Black's Turn";
  else gameStatus = "White's Turn";

  // if king is in check, add in status
  if (check && canMove) gameStatus += " - Check";
  // if king is in check and there are no moves left, other player won
  else if (check && !canMove) {
    gameStatus = turn === 0 ? "Black Won..!!" : "White Won..!!";
    audioElements[2].play();
  }
  // if king is not in check and no moves left, stale mate / draw
  else if (!check && !canMove) {
    gameStatus = "Draw..!!";
    audioElements[2].play();
  }
}

function changeTurn() {
  turn ^= 1;
  selected = deselect(board, plane3D);
}

function displayGameStatus() {
  if (check) {
    const { x, y } = getKing(board, turn);
    plane3D[x][y].visible = true;
    plane3D[x][y].material.color.setRGB(1, 0, 0);
  }
  console.log(gameStatus);
  setTimeout(() => botMove(), 1000);
}

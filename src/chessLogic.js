import { MOVE_RULES, TURN_NAME } from "./chessConstants.js";
import { select3D, deselect3D, move3D } from "./3d.js";

// this function selects the piece at cellXY coordinate and highlights all valid moves / attacks on board for that piece
export function select(board, turn, cellXY, history = [], plane3D) {
  deselect(board, plane3D);
  const cell = getElement(board, cellXY);
  if (!cell.color || cell.color !== TURN_NAME[turn]) return null;
  const { validMoves, validAttacks } = calculateMoves(
    board,
    turn,
    cellXY,
    history
  );
  select2D(board, cellXY, validMoves, validAttacks);
  select3D(plane3D, cellXY, validMoves, validAttacks);
  return cellXY;
}

function select2D(board, cellXY, validMoves, validAttacks) {
  const cell = getElement(board, cellXY);
  cell.selected = true;
  validMoves.forEach(({ x, y }) => (board[x][y].validMove = true));
  validAttacks.forEach(({ x, y }) => (board[x][y].validAttack = true));
}

// this function clears attributes for highlighted cells
export function deselect(board, plane3D) {
  deselect2D(board);
  deselect3D(plane3D);
  return null;
}

function deselect2D(board) {
  board.forEach((row) =>
    row.forEach((cell) => {
      cell.selected = false;
      cell.validMove = false;
      cell.validAttack = false;
      cell.check = false;
    })
  );
}

// this function moves the piece from source to target
export function move(board, source, target, history, board3D) {
  const sourceElement = getElement(board, source);
  const targetElement = getElement(board, target);
  // record the move as history item for undo function
  // castling and en-passent have side effects where more than 2 cell are effected, these are saved separately in sideEffects array
  let historyItem;
  if (history) {
    historyItem = {
      source,
      sourceElement: { ...sourceElement },
      target,
      targetElement: { ...targetElement },
      attack: targetElement.validAttack,
      sideEffects: [],
    };
    history.push(historyItem);
  }

  // castling move, rook also has to be moved
  if (sourceElement.type === "KING" && Math.abs(source.y - target.y) === 2) {
    const rookSource = { x: source.x, y: target.y === 2 ? 0 : 7 };
    const rookTarget = { x: source.x, y: target.y === 2 ? 3 : 5 };
    move(board, rookSource, rookTarget, historyItem?.sideEffects, board3D);
  }

  // en-passant, moving pawn back and then capturing it
  if (
    sourceElement.type === "PAWN" &&
    targetElement.validAttack &&
    !targetElement.color &&
    source.y !== target.y
  ) {
    const pawnSource = { x: source.x, y: target.y };
    const pawnTarget = { ...target };
    move(board, pawnSource, pawnTarget, historyItem?.sideEffects, board3D);
  }
  move2D(board, source, target);
  move3D(board3D, source, target);

  // pawn promotion - pawn has reach end, dont't change turn
  if (
    board[target.x][target.y].type === "PAWN" &&
    (target.x === 7 || target.x === 0)
  )
    return false;
  return true;
}

function move2D(board, source, target) {
  const sourceElement = getElement(board, source);
  board[target.x][target.y] = { ...sourceElement, moved: true };
  sourceElement.name = "";
  sourceElement.color = "";
  sourceElement.type = "";
  sourceElement.moved = false;
}

export function promotePawn2D(board, cellXY, name) {
  const cell = getElement(board, cellXY);
  cell.name = name;
  [cell.color, cell.type] = name.split("_");
}

export function undoMove(board, prevMove) {
  const { source, sourceElement, target, targetElement, sideEffects } =
    prevMove;
  if (sideEffects.length > 0)
    for (const sideEffect of sideEffects) undoMove(board, sideEffect);
  board[source.x][source.y] = { ...sourceElement };
  board[target.x][target.y] = { ...targetElement };
}

// this function calculates all valid moves / attacks from a piece at cellXY coordinate
function calculateMoves(board, turn, cellXY, history = []) {
  const validMoves = [],
    validAttacks = [];
  const cell = getElement(board, cellXY);
  if (!cell.color || cell.color !== TURN_NAME[turn])
    return { validMoves, validAttacks };
  const direction = cell.color === "WHITE" ? -1 : 1;
  const maxMoves = MOVE_RULES[cell.type].unlimited
    ? 8
    : cell.type === "PAWN" && !cell.moved
    ? 2
    : 1;
  for (let del of MOVE_RULES[cell.type].move) {
    for (let m = 0, nextX = cellXY.x, nextY = cellXY.y; m < maxMoves; m++) {
      nextX += direction * del[0];
      nextY += direction * del[1];
      if (invalidCell(nextX, nextY)) break;
      const nextColor = board[nextX][nextY].color;
      if (nextColor === cell.color) break;
      if (!checkKing(board, turn, cellXY, { x: nextX, y: nextY })) continue;
      if (!nextColor) {
        validMoves.push({ x: nextX, y: nextY });
        continue;
      }
      if (cell.color !== nextColor) {
        validAttacks.push({ x: nextX, y: nextY });
        break;
      }
    }
  }

  // pawns attack differently than they move, recalculate valid attack for pawn
  if (cell.type === "PAWN") {
    validAttacks.length = 0;
    for (let del of MOVE_RULES[cell.type].attack) {
      const nextX = cellXY.x + direction * del[0];
      const nextY = cellXY.y + direction * del[1];
      if (invalidCell(nextX, nextY)) continue;
      const nextColor = board[nextX][nextY].color;
      if (nextColor === cell.color) continue;
      if (!checkKing(board, turn, cellXY, { x: nextX, y: nextY })) continue;
      if (nextColor && cell.color !== nextColor) {
        validAttacks.push({ x: nextX, y: nextY });
      }
      // en-passant
      else if (!nextColor && cell.moved) {
        const prevMove = history.slice(-1)[0];
        if (
          prevMove.sourceElement.type === "PAWN" &&
          Math.abs(prevMove.source.x - prevMove.target.x) === 2 &&
          cellXY.x === prevMove.target.x &&
          nextY === prevMove.target.y
        ) {
          validAttacks.push({ x: nextX, y: nextY });
        }
      }
    }
  }

  // castling
  if (cell.type === "KING" && !cell.moved) {
    // king side
    checkCastling(board, turn, cellXY, validMoves, 1);
    // queen side
    checkCastling(board, turn, cellXY, validMoves, -1);
  }

  return { validMoves, validAttacks };
}

// this function check and adds possible castling to validMoves array
function checkCastling(board, turn, kingXY, validMoves, dir) {
  // check rook has not moved
  const rookXY = { x: kingXY.x, y: kingXY.y + (dir === 1 ? 3 : -4) };
  const rook = getElement(board, rookXY);
  if (rook.type !== "ROOK" || rook.moved) return;

  // cell in between king & rook should be empty
  for (let y = kingXY.y + dir; y !== rookXY.y; y += dir) {
    if (board[kingXY.x][y].color) return;
  }

  // king should not be under attack, pass through or end up under attack
  const rookTargetXY = { x: kingXY.x, y: kingXY.y + dir };
  const kingTargetXY = { x: kingXY.x, y: kingXY.y + dir * 2 };
  if (!checkKing(board, turn, kingXY, kingXY)) return;
  if (!checkKing(board, turn, kingXY, rookTargetXY)) return;
  if (!checkKing(board, turn, kingXY, kingTargetXY)) return;
  validMoves.push(kingTargetXY);
}

// this function checks if the current king is safe after any piece moves from source to target
export function checkKing(board, turn, source, target) {
  // create a duplicate board
  const tempBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  // make the move in duplicate board
  move(tempBoard, source, target);

  //find current player's king
  const kingXY = getKing(tempBoard, turn);

  // search if any piece can attack king
  for (let key in MOVE_RULES) {
    const color = TURN_NAME[turn];
    const type = key;
    const delta =
      type === "PAWN" ? MOVE_RULES[type].attack : MOVE_RULES[type].move;
    const direction = type === "PAWN" && color === "WHITE" ? -1 : 1;
    const maxMoves = MOVE_RULES[type].unlimited ? 8 : 1;
    for (let del of delta) {
      for (let x = 0, nextX = kingXY.x, nextY = kingXY.y; x < maxMoves; x++) {
        nextX += direction * del[0];
        nextY += direction * del[1];
        if (invalidCell(nextX, nextY)) break;
        const { color: nextColor, type: nextType } = tempBoard[nextX][nextY];
        if (!nextColor) continue;
        if (nextColor !== color && nextType === type) return false;
        break;
      }
    }
  }
  return true;
}

// this function calculates if the current player has any move left
export function canPlayerMove(board, turn, history) {
  // for each check if there is a possible move
  return board.some((row, x) =>
    row.some((_, y) => {
      const { validMoves, validAttacks } = calculateMoves(
        board,
        turn,
        {
          x,
          y,
        },
        history
      );
      return validMoves.length + validAttacks.length > 0;
    })
  );
}

// this function finds the location of current players king
export function getKing(board, turn) {
  let x, y;
  board.find((row, r) =>
    row.find((cell, c) => {
      if (cell.color === TURN_NAME[turn] && cell.type === "KING") {
        x = r;
        y = c;
        return true;
      }
      return false;
    })
  );
  return { x, y };
}

function getElement(board, { x, y }) {
  return board[x][y];
}

function invalidCell(x, y) {
  return x < 0 || y < 0 || x > 7 || y > 7;
}

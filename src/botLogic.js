import { ChessAI } from "@ibrahimdeniz/chess-js";
import { castlingRight } from "./chessLogic.js";

export const PIECE = {
  p: "PAWN",
  n: "KNIGHT",
  b: "BISHOP",
  r: "ROOK",
  q: "QUEEN",
  k: "KNIGHT",
};

const ai = new ChessAI();

export function getMove(board, turn, history) {
  const fen = generateFEN(board, turn, history);
  const nextMove = ai.selectMove(fen, { depth: 1 });
  return nextMove;
}

function generateFEN(board, turn, history) {
  let fen = "";
  // Piece Placement
  board.forEach((row) => {
    let fenRow = "";
    let count = 0;
    row.forEach((cell) => {
      const piece = cell.type?.[0];
      if (!piece) count++;
      else {
        if (count > 0) fenRow += count;
        count = 0;
        let initial = cell.type === "KNIGHT" ? "N" : piece;
        fenRow += cell.color === "BLACK" ? initial.toLowerCase() : initial;
      }
    });
    if (count > 0) fenRow += count;
    fen += fenRow + "/";
  });

  // Active Color
  fen += turn == 0 ? " w" : " b";

  // Castling Rights
  fen += " ";
  if (castlingRight(board, 0, 1)) fen += "K";
  if (castlingRight(board, 0, -1)) fen += "Q";
  if (castlingRight(board, 1, 1)) fen += "k";
  if (castlingRight(board, 1, -1)) fen += "q";
  if (fen[fen.length - 1] == " ") fen += "-";

  // Possible En Passant Targets
  fen += " ";
  const prevMove = history[history.length - 1];
  if (prevMove) {
    if (
      prevMove.sourceElement.type === "PAWN" &&
      Math.abs(prevMove.source.x - prevMove.target.x) === 2
    ) {
      fen += String.fromCharCode(prevMove.source.y + 97);
      const midX = (prevMove.source.x + prevMove.target.x) / 2;
      fen += 8 - midX;
    }
  }
  if (fen[fen.length - 1] == " ") fen += "-";

  // Halfmove Clock
  fen += " ";
  let flag = true;
  fen += history.reduceRight((sum, prevMove) => {
    if (flag && !prevMove.attach && prevMove.sourceElement.type !== "PAWN")
      return sum + 1;
    flag = false;
    return sum;
  }, 0);

  // Fullmove Number
  fen += " " + (Math.floor(history.length / 2) + 1);
  return fen;
}

export function parseLocation(code) {
  const x = 8 - code[1];
  const y = code.charCodeAt(0) - 97;
  return { x, y };
}

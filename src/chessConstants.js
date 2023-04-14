// default game positions
export const DEFAULT_BOARD = [
  [
    "BLACK_ROOK",
    "BLACK_KNIGHT",
    "BLACK_BISHOP",
    "BLACK_QUEEN",
    "BLACK_KING",
    "BLACK_BISHOP",
    "BLACK_KNIGHT",
    "BLACK_ROOK",
  ],
  [
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
  ],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
  ],
  [
    "WHITE_ROOK",
    "WHITE_KNIGHT",
    "WHITE_BISHOP",
    "WHITE_QUEEN",
    "WHITE_KING",
    "WHITE_BISHOP",
    "WHITE_KNIGHT",
    "WHITE_ROOK",
  ],
];

// utf codes for each piece
export const UTF_CODES = {
  WHITE_KING: "\u2654",
  WHITE_QUEEN: "\u2655",
  WHITE_ROOK: "\u2656",
  WHITE_BISHOP: "\u2657",
  WHITE_KNIGHT: "\u2658",
  WHITE_PAWN: "\u2659",
  BLACK_KING: "\u265A",
  BLACK_QUEEN: "\u265B",
  BLACK_ROOK: "\u265C",
  BLACK_BISHOP: "\u265D",
  BLACK_KNIGHT: "\u265E",
  BLACK_PAWN: "\u265F",
};

// piece wise movement / attack rules
export const MOVE_RULES = {
  KING: {
    move: [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
      [-1, 0],
      [0, -1],
      [-1, -1],
      [-1, 1],
    ],
    unlimited: false,
  },
  QUEEN: {
    move: [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
      [-1, 0],
      [0, -1],
      [-1, -1],
      [-1, 1],
    ],
    unlimited: true,
  },
  ROOK: {
    move: [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ],
    unlimited: true,
  },
  BISHOP: {
    move: [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ],
    unlimited: true,
  },
  KNIGHT: {
    move: [
      [2, 1],
      [2, -1],
      [1, 2],
      [-1, 2],
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [1, -2],
    ],
    unlimited: false,
  },
  PAWN: {
    move: [[1, 0]],
    unlimited: false,
    attack: [
      [1, 1],
      [1, -1],
    ],
  },
};

export const TURN_NAME = ["WHITE", "BLACK"];

// options for pawn promotion
export const PAWN_PROMOTION = ["ROOK", "KNIGHT", "BISHOP", "QUEEN"];

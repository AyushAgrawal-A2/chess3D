import {
  create3DBoard,
  onWindowResize,
  getClickedPosition,
} from "./public/js/3d.js";
import { board, handleBoardClick } from "./public/js/script.js";

window.addEventListener("resize", onWindowResize);
window.addEventListener("click", onClick);

const board3D = await create3DBoard(board);

function onClick(event) {
  const cellXY = getClickedPosition(event);
  if (cellXY) handleBoardClick(board3D, cellXY);
}

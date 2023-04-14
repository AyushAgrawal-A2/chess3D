function handleModalClick(event) {
  if (!waitForPromotion) return;
  const name = event.target.dataset.name;
  if (!name) return;
  waitForPromotion = false;
  turn ^= 1;
  promotePawn(board, name);
  displayGameStatus();
  displayBoard();
}

function handleControlsClick(event) {
  if (event.target.classList.contains("flip")) flipBoard();
  else if (event.target.classList.contains("flip-every-move"))
    flipCheckBox(event);
  else if (event.target.classList.contains("undo")) undo();
  else if (event.target.classList.contains("reset")) resetGame();
}

function undo() {
  if (history.length === 0) return;
  const prevMove = history.pop();
  turn = prevMove.sourceElement.color === "WHITE" ? 0 : 1;
  waitForPromotion = false;
  if (prevMove.attack) captured[turn].pop();
  undoMove(board, prevMove);
  displayGameStatus();
  displayBoard();
}

function displayGameStatus() {
  // check if there are any possible moves
  canMove = canPlayerMove(board, turn, history);

  // check if the king is in check status
  check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });

  selected = deselect(board);

  if (turn) gameStatus = "Black's Turn";
  else gameStatus = "White's Turn";

  // if king is in check, add in status
  if (check && canMove) gameStatus += " - Check";
  // if king is in check and there are no moves left, other player won
  else if (check && !canMove)
    gameStatus = turn === 0 ? "Black Won..!!" : "White Won..!!";
  // if king is not in check and no moves left, stale mate / draw
  else if (!check && !canMove) gameStatus = "Draw..!!";

  gameStatusElement.textContent = gameStatus;
}

function displayBoard() {
  // if king is in check, add danger attribute to display
  if (check) {
    const { x: kingX, y: kingY } = getKing(board, turn);
    board[kingX][kingY].check = true;
  }

  // clear display
  boardElement.innerHTML = "";
  capturedElements.forEach(
    (capturedElement) => (capturedElement.innerHTML = "")
  );

  // render new display
  board.forEach((row, x) => {
    const rowElement = createRowElement();
    row.forEach((cell, y) => {
      rowElement.append(createCellElement(cell, x, y));
    });

    boardElement.append(rowElement);
  });

  // render captured pieces
  captured.forEach((group, i) =>
    group.forEach((item) => {
      const smallCellElement = createSmallCellElement(item);
      capturedElements[i ^ 1].appendChild(smallCellElement);
    })
  );

  displayModal();
}

function displayModal() {
  removeModal();
  if (!waitForPromotion) return;
  PAWN_PROMOTION.forEach((option) =>
    modalElement.append(createPromotionElement(option))
  );
  const { top, bottom, left, right } = boardElement.getBoundingClientRect();
  const x = (top + bottom) / 2;
  const y = (left + right) / 2;
  modalElement.style.top = `${x}px`;
  modalElement.style.left = `${y}px`;
}

function removeModal() {
  modalElement.innerHTML = "";
}

function createRowElement() {
  const rowElement = document.createElement("div");
  rowElement.className = "row";
  return rowElement;
}

function createCellElement(cell, x, y) {
  const cellElement = document.createElement("div");
  cellElement.className = "cell";
  cellElement.dataset.symbol = UTF_CODES[cell.name] ?? "";
  cellElement.dataset.x = x;
  cellElement.dataset.y = y;
  if (cell.selected || cell.validMove) cellElement.classList.add("highlight");
  if (cell.validAttack || cell.check) cellElement.classList.add("danger");
  return cellElement;
}

function createSmallCellElement(item) {
  const smallCellElement = document.createElement("div");
  smallCellElement.className = "cell small";
  smallCellElement.dataset.symbol = UTF_CODES[item] ?? "";
  return smallCellElement;
}

function createPromotionElement(option) {
  const promotionElement = document.createElement("div");
  const name = TURN_NAME[turn] + "_" + option;
  promotionElement.className = "cell";
  promotionElement.dataset.symbol = UTF_CODES[name];
  promotionElement.dataset.name = name;
  return promotionElement;
}

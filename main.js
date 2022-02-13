// Setup some constants
const PIECE_NUMBER_OF_BITS = 64;
const GRID_NUMBER_OF_COLS = 16;
const GRID_NUMBER_OF_ROWS = 32;
const GRID_LAST_ROW_ID = 31;
const LOOP_DEFAULT_SPEED = 100;

// All available pieces in their different positions
const PIECES = [
  Object.freeze({values: [0x080008000800080, 0x3C0000000000000,
    0x080008000800080, 0x3C0000000000000], color: '#FF8000'}),
  Object.freeze({values: [0x080038000000000, 0x180008000800000,
    0x380020000000000, 0x200020003000000], color: '#00FF00'}),
  Object.freeze({values: [0x1C0008000000000, 0x080018000800000,
    0x08000C000800000, 0x08001C000000000], color: '#0000FF'}),
  Object.freeze({values: [0x08000C000400000, 0x0C0018000000000,
    0x0C0018000000000, 0x08000C000400000], color: '#00FFFF'}),
  Object.freeze({values: [0x180018000000000, 0x180018000000000,
    0x180018000000000, 0x180018000000000], color: '#0080FF'}),
];

// Generate the main grid
const grid = [];
const div = document.createElement('div');
div.classList.add('trix-container');

Array(GRID_NUMBER_OF_ROWS).fill((rowId) => {
  const row = document.createElement('div');
  row.classList.add('trix-row');
  Array(GRID_NUMBER_OF_COLS).fill(() => {
      const col = document.createElement('div');
      col.classList.add('trix-col');
      return col;
  }).forEach((getCol, index) => {
    if (!index) {
      grid.push({data: []});
    }
    const col = getCol();
    const [gridRow] = grid.slice(-1);
    gridRow.data.push(col);
    row.appendChild(col);
    // Fill the last row
    if (rowId === GRID_LAST_ROW_ID) {
      col.dataset.stopped = 'true';
      col.style.backgroundColor = '#FF0000';
      gridRow.value = BigInt(0xFFFF);
    }
  });
  return row;
}).forEach((getRow, index) => {
  div.appendChild(getRow(index));
});

document.body.appendChild(div);

// Generate a new piece
const piece = {};
const getPiece = () => {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  piece.pos = 0;
  piece.color = p.color;
  piece.value = BigInt(p.values[Math.floor(Math.random() * 4)]);
};

// Check if the current piece is in collision with one or more stopped 'cells'
const isColliding = (p) => {
  if (!p) {
    p = {...piece, pos: piece.pos + 1};
  }
  const value = BigInt(`0x${Array(4).fill().map(
    (_, index) => {
      const id = index + p.pos;
      return (
        (id >= GRID_NUMBER_OF_ROWS) ?
          ((1 << GRID_NUMBER_OF_COLS) - 1) :
            grid[id].value
      ).toString(16).padStart(4, '0');
    }
   ).join('')}`);
    return value & p.value;
};

// Update the falling piece
const updatePiece = (stop) => {
  for (let slot = 0; slot < 4; slot++) {
    const id = piece.pos + 3 - slot;
    if (id < GRID_NUMBER_OF_ROWS) {
      const row = grid[id];
      row.data.forEach((col, index) => {
        const bitOffset = (BigInt(1) << BigInt(index + slot * GRID_NUMBER_OF_COLS));
        if (bitOffset & piece.value) {
          col.style.backgroundColor = piece.color;
          if (stop) {
            col.dataset.stopped = 'true';
          }
        }
      });
    }
  }
  if (!stop) {
    piece.pos++;
  }
};

// Update the 16bits representative value of each row
// And clean the grid, excluding the 'stopped' cells
const updateGrid = () => {
  grid.forEach((row, index) => {
    if (index < GRID_LAST_ROW_ID) {
      let value = BigInt(0);
      row.data.forEach((col, index) => {
        if (col.dataset.stopped !== 'true') {
          col.style.backgroundColor = 'black';
        } else {
          value |= (BigInt(1) << BigInt(index));
        }
      });
      row.value = BigInt(value);
    }
  });
};

// Fake move for the demo
const fakeMove = () => {
  if (Math.random() > 0.5) {
    const value = piece.value << BigInt(1);
    if (!(BigInt(0x8000800080008000) & value)) {
      if (!isColliding({...piece, value})) {
        piece.value = value;
      }
    }
  } else {
    const value = piece.value >> BigInt(1);
    if (!(BigInt(0x1000100010001) & value)) {
      if (!isColliding({...piece, value})) {
        piece.value = value;
      }
    }
  }
};

// function(s) called within the loop
const run = () => {
  updateGrid();
  updatePiece(false);
  fakeMove();
  if (isColliding()) {
    updatePiece(true);
    getPiece();
  }
};

// Setup the loop
let prev = 0;
const loop = (now) => {
    if (now - prev >= LOOP_DEFAULT_SPEED) {
        prev = now;
        run();
    }
    requestAnimationFrame(loop);
}

// Get the first piece then loop
getPiece();
loop(LOOP_DEFAULT_SPEED);
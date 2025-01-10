// Font size
const letterWidth = 5;
const letterHeight = 5;

const spaceSize = 1;

// Pixel font definitions (5x5 for selected characters)
const fontMap = {
  A: ["01110", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "11110", "10001", "11110"],
  C: ["01110", "10001", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000"],
  G: ["01110", "10000", "10111", "10001", "01110"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "11111"],
  J: ["00111", "00001", "00001", "10001", "01110"],
  K: ["10001", "10010", "11100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10101", "01111"],
  R: ["11110", "10001", "11110", "10010", "10001"],
  S: ["01111", "10000", "01110", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  X: ["10001", "01010", "00100", "01010", "10001"],
  Y: ["10001", "01010", "00100", "00100", "00100"],
  Z: ["11111", "00010", "00100", "01000", "11111"],
  "-": ["00000", "00000", "11111", "00000", "00000"],
  ".": ["00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "01100", "00100"],
  "0": ["01110", "10001", "10011", "10101", "01110"],
  "1": ["00100", "01100", "00100", "00100", "11111"],
  "2": ["11110", "00001", "01110", "10000", "11111"],
  "9": ["01110", "10001", "01111", "00001", "11110"]
};

// Typing state
let currentRow = 0;
let currentCol = 0;

function drawLetter(letter, row, col) {
  const pattern = fontMap[letter.toUpperCase()] || null;
  if (!pattern) return;

  for (let r = 0; r < letterHeight; r++) {
    for (let c = 0; c < letterWidth; c++) {
      if (row + r >= gridRows || col + c >= gridCols) continue;
      if (pattern[r][c] === "1") {
        cells[row + r][col + c].addClass("cell--active");
        updateBinaryPatterns();
      }
    }
  }
}

let previousValue = $(".textbox").val();

document.addEventListener("input", () => {
  const currentValue = $(".textbox").val();

  if (currentValue.length < previousValue.length) {
    $(".cell.cell--active").removeClass("cell--active");

    updateBinaryPatterns();
    
    currentRow = 0;
    currentCol = 0;    
  
    let txt = $(".textbox").val();
    for (let i=0; i<txt.length; i++) {
      if (txt[i] === "\n") {
        type("\n");
      } else {
        type(txt[i]);
      }
    }
  } else {
    type($(".textbox").val().at(-1));
  }

  previousValue = currentValue;
});

function type(key) {
  if (key === "\n") {
    currentRow += letterHeight + 1;
    currentCol = 0;
  }  else if (key === " ") {
    currentCol += spaceSize;
    if (currentCol + letterWidth > gridCols) {
      currentRow += letterHeight + 1;
      currentCol = 0;
    }
  } else if (key.length === 1 && /^[A-Z0-9\-.,]$/i.test(key)) {
    if (currentCol + letterWidth <= gridCols) {
      drawLetter(key, currentRow, currentCol);
      currentCol += letterWidth + 1;
    }
    if (currentCol + letterWidth > gridCols) {
      currentRow += letterHeight + 1;
      currentCol = 0;
    }
  }
}

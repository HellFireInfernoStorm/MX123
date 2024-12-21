const cells = []

function createGrid() {
  let cloneBtn = (r, c) => {
    return `<button class="cell" data-row="${r}" data-col="${c}"></button>`;
  }
  
  $(".grid").empty();

  for (let row=0; row<64; row++) {
    cells[row] = [];
    for (let col=0; col<32; col++) {
      $(".grid").append(cloneBtn(row, col));
      cells[row][col] = $(`.cell[data-row=${row}][data-col="${col}"]`);
    }
  }
}

// Update binary patterns dynamically
const binaryOutput = document.getElementById('binaryOutput');
const cellSize = 20;
const gridRows = 64;
const gridCols = 32;

function updateBinaryPatterns() {

  binaryOutput.innerHTML = "";

  // Display the first binary pattern (1 to 64), each pattern has 64 bits
  for (let row = 0; row < gridRows; row++) {
    let binaryPattern = "0b"; // Adding the prefix "0b"
    for (let col = 0; col < gridCols; col++) {
      binaryPattern += cells[row][col].hasClass('cell--active') ? "1" : "0";
    }
    binaryOutput.innerHTML += `${binaryPattern},<br>`;
  }

  binaryOutput.style.visibility = "visible";
}

$(document).ready(() => {

  createGrid();
  updateBinaryPatterns();

  // Tabs state management
  $(".tab-link").on("click", ({target}) => {
    let active = "tab-link--active";
    let isActive = $(target).hasClass(active);

    if (!isActive) {
      $(`.${active}`).removeClass(active);
      $(target).addClass(active);
    }

    // someFunction()
  });

  // Grid cells state management
  $(".grid").on("click", ({target}) => {
    let active = "cell--active";
    let isActive = $(target).hasClass(active);

    if (isActive) {
      $(target).removeClass(active);
    } else {
      $(target).addClass(active);
    }
  });

  // Drawing function
  let isKeyDown = false;
  let pressedKey = null;
  let debounceTimer;  // Define the debounceTimer outside to ensure it is not redefined every mousedown
  
  // Track key presses and releases
  $(document).on("keydown", ({key}) => {
    pressedKey = key;
  });
  
  $(document).on("keyup", () => {
    pressedKey = null;
  });
  
  // Start drawing when mouse is pressed
  $(".grid").on("mousedown", () => {
    if (!isKeyDown) {
      isKeyDown = true;
    }
  
    // Use event delegation to handle mouseenter on .cell elements
    $(".grid").on("mouseenter", ".cell", ({target}) => {
      if (isKeyDown) {
        clearTimeout(debounceTimer); // Clear any previous debounce timer
        debounceTimer = setTimeout(() => {
          if (pressedKey === "Control") {
            $(target).removeClass("cell--active");
          } else {
            $(target).addClass("cell--active");
          }
        }, 20); // Adjust debounce time as necessary
      }
    });
  });
  
  // Stop drawing when mouse is released
  $(".grid").on("mouseup", () => {
    isKeyDown = false;
    // Remove the mouseenter handler when mouse is up to prevent unnecessary event bindings
    $(".grid").off("mouseenter", ".cell");
  });
});

$(".copy").on("click", () => {
  const txt = $("#binaryOutput").html().replaceAll("<br>", "\r\n");
  navigator.clipboard.writeText(txt);
});

$("#postBtn").on("click", () => {
  const txt = $("#binaryOutput").html().replaceAll("<br>", "\r\n");

  fetch('/update', {
    method: 'POST',
    body: JSON.stringify({
      title: 'binary',
      body: txt,
      userId: 1,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
    .then((response) => response.json())
    .then((json) => console.log(json));
});

// Offsets for shifting the image overlay
let xOffset = 0; // Horizontal offset
let yOffset = 0; // Vertical offset

// Prevent page scrolling when using arrow keys
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }
});

$(".arrow").on("click", ({target}) => {
  arrowsMove($(target).attr("data-dir"));
});

// Handle keyboard arrow key presses to shift the overlay
document.addEventListener('keydown', (event) => {
  arrowsMove(event.key);
});

function arrowsMove(key) {
  const activeCells = $(".cell--active");

  switch (key) {
    case 'ArrowUp':
      if (!activeCells.is('[data-row="0"]')) yOffset = -1;
      break;
    case 'ArrowDown':
      if (!activeCells.is('[data-row="63"]')) yOffset = 1;
      break;
    case 'ArrowLeft':
      if (!activeCells.is('[data-col="0"]')) xOffset = -1;
      break;
    case 'ArrowRight':
      if (!activeCells.is('[data-col="31"]')) xOffset = 1;
      break;
    default:
      return; // Ignore other keys
  }

  moveActiveCells(); // Reprocess image overlay with updated offsets
}

function moveActiveCells() {
  
  const activeCells = $(".cell.cell--active");
  $(".cell").removeClass("cell--active");

  activeCells.each(function () {
    const currentCell = $(this);
    const rowOffset = parseInt(currentCell.attr("data-row")) + yOffset;
    const colOffset = parseInt(currentCell.attr("data-col")) + xOffset;

    // Ensure boundaries are respected
    if (
      rowOffset >= 0 && rowOffset <= 63 &&
      colOffset >= 0 && colOffset <= 31
    ) {
      // Activate the new cell
      $(`[data-row="${rowOffset}"][data-col="${colOffset}"]`).addClass("cell--active");
    }
  });

  xOffset = 0;
  yOffset = 0;
}

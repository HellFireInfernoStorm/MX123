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

createGrid();

// Update binary patterns dynamically
const binaryOutput = document.getElementById('binaryOutput');
const cellSize = 20;
const gridRows = 64;
const gridCols = 32;

function updateBinaryPatterns() {
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

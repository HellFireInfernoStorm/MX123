$(document).ready(() => {
  $(".img-upload").on("click", () => {
    $(".input-img").click();
  });
});

const grid = document.getElementById('grid');

// Offsets for shifting the image overlay
let xOffset = 0; // Horizontal offset
let yOffset = 0; // Vertical offset

// Prevent page scrolling when using arrow keys
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }
});

// Handle keyboard arrow key presses to shift the overlay
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      yOffset--; // Move up
      break;
    case 'ArrowDown':
      yOffset++; // Move down
      break;
    case 'ArrowLeft':
      xOffset--; // Move left
      break;
    case 'ArrowRight':
      xOffset++; // Move right
      break;
    default:
      return; // Ignore other keys
  }
  processImageOverlay(currentImage); // Reprocess image overlay with updated offsets
});

let currentImage = null; // To hold the currently uploaded image

// Handle image upload
document.getElementById('imageUpload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        currentImage = img; // Store the current image
        processImageOverlay(img); // Process the uploaded image
      };
    };
    reader.readAsDataURL(file);
  }
});

// Function to process the image overlay with offsets
function processImageOverlay(img) {
  if (!img) return; // Do nothing if no image is loaded

  // Draw the image on the hidden canvas with adjusted offsets
  const canvas = document.getElementById('hiddenCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = gridCols * cellSize;
  canvas.height = gridRows * cellSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    xOffset * cellSize,
    yOffset * cellSize,
    img.width,
    img.height
  );

  // Update the grid based on the new overlay
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const startX = col * cellSize;
      const startY = row * cellSize;
      const cellData = ctx.getImageData(startX, startY, cellSize, cellSize).data;

      let isOccupied = false;
      for (let i = 3; i < cellData.length; i += 4) {
        if (cellData[i] > 0) { // Alpha channel check
          isOccupied = true;
          break;
        }
      }

      // Mark or unmark the cell based on occupancy
      if (isOccupied) {
        cells[row][col].addClass('cell--active');
      } else {
        cells[row][col].removeClass('cell--active');
      }
    }
  }

  // Update binary patterns after shifting
  updateBinaryPatterns();
}

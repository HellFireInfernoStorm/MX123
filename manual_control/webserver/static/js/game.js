// Create grid

const cells = []

// $(document).on("click", ({target}) => {
//   console.log(target);
// });

function postBinaryPattern() {
  const txt = $("#binaryOutput").html().replaceAll("<br>", "\r\n");

  console.log(txt);

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
}

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
}

function createGrid() {
  const totalRows = 64;
  const totalCols = 32;
  const batchSize = 8; // Number of rows to process per batch
  let currentRow = 0;

  // Function to process a batch of rows
  function processBatch() {
    for (let row = currentRow; row < currentRow + batchSize && row < totalRows; row++) {
      cells[row] = [];
      for (let col = 0; col < totalCols; col++) {
        // Dynamically append buttons to the grid
        $(".grid").append(`<button class="cell" data-row="${row}" data-col="${col}"></button>`);
        cells[row][col] = $(`.cell[data-row=${row}][data-col="${col}"]`);
      }
    }
    currentRow += batchSize;

    if (currentRow < totalRows) {
      // Schedule the next batch to run
      setTimeout(processBatch, 0);
    }
  }

  // Start the asynchronous grid creation
  $(".grid").empty(); // Clear the grid before populating
  processBatch();
}

createGrid();

// Starting variables

const numbers = {
  0: ["01110", "10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  1: ["00100", "01100", "10100", "00100", "00100", "00100", "00100", "11111"],
  2: ["11111", "00001", "00001", "11111", "10000", "10000", "10000", "11111"],
  3: ["11111", "00001", "00001", "11111", "00001", "00001", "00001", "11111"],
  4: ["10000", "10000", "10100", "10100", "11111", "00100", "00100", "00100"],
  5: ["11111", "10000", "10000", "10000", "11111", "00001", "00001", "11111"],
  6: ["11111", "10000", "10000", "11111", "10001", "10001", "10001", "11111"],
  7: ["11111", "00001", "00010", "00100", "00100", "00100", "00100", "00100"],
  8: ["01111", "01001", "01001", "11111", "10001", "10001", "10001", "11111"],
  9: ["11111", "10001", "11111", "00001", "00001", "00001", "00001", "00001"],
  x: 10,
  y: 47
}

const scoreText = {
  font: [
    "01111001110001110011110011111000",
    "10000010001010001010001010000000",
    "01110010000010001011110011110000",
    "00001010001010001010010010000000",
    "11110001110001110010001011111000",
  ],
  y: 57,
  x: 2
}

const strip = { y: [43, 44] };

let spaceShipSkin = {
  A: {
    body: [
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0], 
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], 
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], 
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ],
    weapons: [
      [34, 11],
      [34, 19],
      [31, 15]
    ],
    front: {
      y: [4, 2, 3, 3, 1, 0, 1, 3, 3, 2, 4],
      x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
  },
}

let gameIsOn = true;
let asteroids = [];
let asteroidSpeed = 500;
let bullets = [];
let firstLoad = true;
let score = 0;

const binaryOutput = document.getElementById('binaryOutput');
const gridRows = 64;
const gridCols = 32;

// General functions

function getRandomInt(min = 0, max) {
  min = Math.ceil(min);
  max = Math.floor(max) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(millisec) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, millisec);
  })
}

// Game classes

class Asteroid {
  constructor(xPos) {
    this.xPos = xPos;
    this.yPos = -1;
    this.outOfBounds = false;
  }

  draw() {
    cells[this.yPos][this.xPos].addClass("cell--active");
  }

  erase(x=this.xPos, y=this.yPos) {
    cells[y][x].removeClass("cell--active");
  }

  move() {
    if (this.yPos != -1) {
      this.erase();
    }

    if (this.yPos < 42) {
      this.yPos += 1;
      this.draw();
    } else {
      this.outOfBounds = true;
    }
  }

  static createAsteroidCoords(startPos, size) {
    const xPos = [];
    for (let i = 0; i < size; i++) {
      if (getRandomInt(0, 6) != 1) {
        xPos.push(startPos + i);
      }
    }

    return xPos;
  }

  static cleanSpace(oldAsteroidBelt) {
    const cleanAsteroidBelt = oldAsteroidBelt.filter(rock => !rock.outOfBounds);
    return cleanAsteroidBelt;
  }
}

class SpaceShip {
  constructor(skin) {
    this.skin = skin["body"];
    this.height = this.skin.length;
    this.width = this.skin[0].length;

    this.xStart = Math.floor((32 - this.width) / 2); // The center of the grid
    this.yStart = 40;
    this.coords = this.setSpawn(this.skin);

    this.weapons = skin["weapon"];
  }

  setSpawn() {
    let coords = structuredClone(this.skin);

    for (let h=0; h<this.height; h++) {
      for (let w=0; w<this.width; w++) {
        const x = this.xStart + w;
        const y = this.yStart - h;

        coords[h][w] = [x, y];
        
        if (this.skin[this.height - 1 - h][this.width - 1 - w]) {
          cells[y][x].addClass("cell--active");
        }
      }
    }
    
    return coords;
  }

  move(key) {

    if (key === 68) {
      spaceShipSkin["A"]["weapons"].forEach((weapon, i) => {
        spaceShipSkin["A"]["weapons"][i][1] = weapon[1] + 1;
        if (weapon[1] > 31) {
          spaceShipSkin["A"]["weapons"][i][1] = 0;
        }
      });
    } else if (key === 65) {
      spaceShipSkin["A"]["weapons"].forEach((weapon, i) => {
        spaceShipSkin["A"]["weapons"][i][1] = weapon[1] - 1;
        if (weapon[1] < 0) {
          spaceShipSkin["A"]["weapons"][i][1] = 31;
        }
      });
    }

    for (let h=0; h<this.height; h++) {
      for (let w=0; w<this.width; w++) {
        const x = this.coords[h][w][0];
        const y = this.coords[h][w][1];
        
        if (this.skin[this.height - 1 - h][this.width - 1 - w]) {
          cells[y][x].removeClass("cell--active");
        }

        let newX;
        if (key === 68) {
          newX = x + 1;
          if (newX > 31) {
            newX = 0;
          }
        } else if (key === 65) {
          newX = x - 1;
          if (newX < 0) {
            newX = 31;
          }
        } else {
          return;
        }

        if (gameIsOn) {
          this.coords[h][w] = [newX, y];
        }
      }
    }

    for (let h=0; h<this.height; h++) {
      for (let w=0; w<this.width; w++) {
        const x = this.coords[h][w][0];
        const y = this.coords[h][w][1];

        if (this.skin[this.height - 1 - h][this.width - 1 - w]) {
          cells[y][x].addClass("cell--active");
        }
      }
    }
  }
}

class Bullet {
  constructor(x, y) {
    this.xPos = x;
    this.yPos = y;
    this.outOfBounds = false;
  }

  draw() {
    cells[this.yPos][this.xPos].addClass("cell--active");
  }

  erase(x=this.xPos, y=this.yPos) {
    cells[y][x].removeClass("cell--active");
  }

  move() {
    if (this.yPos != -1) {
      this.erase();
    }

    if (this.yPos > 0) {
      this.yPos -= 1;
      this.draw();
    } else {
      this.outOfBounds = true;
    }
  }

  static cleanSpace(oldBullets) {
    const cleanBullets = oldBullets.filter(bullet => !bullet.outOfBounds);
    return cleanBullets;
  }
}

// Game procedure

$(document).ready(() => {

  $("#stopBtn").on("click", () => {
    gameIsOn = false;
  });

  $("#restartBtn").on("click", () => {
    location.reload();
  })

  $("#startBtn").on("click", () => {
    if (firstLoad) {
      handleAsteroids();
      handleSpaceShip();
      // handleBinaryPattern();
    }

    firstLoad = false;
  });
});

async function handleAsteroids() {
  // await delay(500); // Allows the grid to load

  let step = 0;
  let size = 2;
  let startPos = getRandomInt(0, 32 - size);

  while (gameIsOn) {
    step++;
    await delay(asteroidSpeed);

    handleBinaryPattern();

    // Create rock coordinates
    if (step % size === 0) {
      startPos = getRandomInt(0, 32 - size);
    }

    const xCoords = Asteroid.createAsteroidCoords(startPos, size);
    xCoords.forEach(x => {
      const rock = new Asteroid(x);
      asteroids.push(rock);
    });

    // Move asteroids
    asteroids.forEach(asteroid => {
      asteroid.move();
    });

    // Delete asteroids that go out of the grid
    asteroids = Asteroid.cleanSpace(asteroids);
  }
}

function updateScore(score=0) {
  let scoreInput;

  if (score > 99) {
    numbers.x = 7;
  } else {
    numbers.x = 10;
  }

  if (score < 10) {
    scoreInput = ["0", score.toString().split("")];
  } else {
    scoreInput = score.toString().split("");
  }

  for (let i=0; i<8; i++) {
    for (let j=0; j<20; j++) {
      cells[numbers.y + i][numbers.x + j].removeClass("cell--active");
    }
  }

  scoreInput.forEach((number, k) => {
    numbers[number].forEach((txt, i) => {
      for (let j=0; j<txt.length; j++) {
        if (txt[j] === "1") {
          cells[numbers.y + i][numbers.x + k*6 + j].addClass("cell--active");
        }
      }
    })
  });
}

async function handleSpaceShip() {
  // await delay(2000) // Allows the grid to load;

  scoreText.font.forEach((txt, i) => {
    for (let j=0; j<txt.length; j++) {
      if (txt[j] === "1") {
        cells[scoreText.y + i][scoreText.x + j].addClass("cell--active");
      }
    }
  });

  updateScore();

  strip.y.forEach(col => {
    for (let i=0; i<32; i++) {
      cells[col][i].addClass("cell--active");
    }
  });

  const spaceShip = new SpaceShip(spaceShipSkin['A']);

  $(document).on("keydown", ({which}) => {
    if (which === 32) {
      spaceShipSkin["A"]["weapons"].forEach(weapon => {
        const bullet = new Bullet(weapon[1], weapon[0]);
        bullets.push(bullet);
      });
    } else {
      spaceShip.move(which);
    }
  });

  while (gameIsOn) {
    await delay(50);

    handleBinaryPattern();

    // Move bullets
    bullets.forEach(bullet => {
      bullet.move();
    });

    // Delete asteroids that go out of the grid
    bullets = Bullet.cleanSpace(bullets);    

    // Handle collisions
    const asteroidsCopy = [...asteroids];
    const bulletsCopy = [...bullets];

    for (let i = 0; i < asteroidsCopy.length; i++) {
      const aX = asteroidsCopy[i].xPos;
      const aY = asteroidsCopy[i].yPos;

      for (let j = 0; j < bulletsCopy.length; j++) {
        bX = bulletsCopy[j].xPos
        bY = bulletsCopy[j].yPos;
        if ((aX === bX) && (aY === bY)) {
          asteroids = asteroids.filter((_, index) => index != i);
          bullets = bullets.filter((_, index) => index != j);

          cells[bY][bX].removeClass("cell--active");
          score += 1;
          updateScore(score);

          if (asteroidSpeed > 0) {
            asteroidSpeed -= 1;
          }
        }
      }

      for (let k=0; k < spaceShipSkin["A"]["front"]["x"].length; k++) {
        const sX = spaceShipSkin["A"]["front"]["x"][k];
        const sY = spaceShipSkin["A"]["front"]["y"][k];

        const cX = spaceShip.coords[spaceShip.coords.length - 1 - sY][sX][0];
        const cY = spaceShip.coords[spaceShip.coords.length - 1 - sY][sX][1];
    
        if ((cX === aX) && (cY === aY)) {
          gameIsOn = false;
          console.log("Game Over!");
          return;
        }
      }
    }
  }
}

function handleBinaryPattern() {
  updateBinaryPatterns();
  postBinaryPattern();
}

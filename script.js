const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load assets
const assets = {
  spaceDebris: './assets/spaceDebris.webp',
  ship: './assets/ship.webp',
  alienShip: './assets/ship_alien.webp',
  hit: './assets/hit.webp',
  reset: './assets/reset.webp',
  kill: './assets/kill.webp',
  background: './assets/background.webp',
  powerUp: './assets/Power.gif',
  spaceBackground: './assets/space-background.gif' 
};

const images = {};
for (let key in assets) {
  images[key] = new Image();
  images[key].src = assets[key];
}

// Background variables
let backgroundY = 0;
let backgroundSpeed = 1;

// Game variables
let debrisArray = [];
let shipBullets = [];
let alienBullets = [];
let alienShips = [];
let powerUp = null; // Power-up object

let gameState = {
  debrisSpeed: 3,
  bulletSpeed: 7,
  alienBulletSpeed: 5,
  paused: false,
  gameOver: false,
  alienFireRate: 2000,
  alienFireCounter: 0,
  powerUpActive: false,
  ship: { x: canvas.width / 2 - 40, y: canvas.height - 90, width: 80, height: 90, speed: 7, lives: 4, bullets: 1 },
  alien: { speed: 2, wave: 1, killCount: 0, bulletsPerWave: 1 },
  level: 1,
  maxLevel: 5,
};

// Key controls
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
};

// Add event listeners
document.addEventListener('keydown', (e) => (keys[e.code] = true));
document.addEventListener('keyup', (e) => (keys[e.code] = false));

// Game initialization
function init() {
  createAlienWave();
  gameLoop();
}

// Game loop
function gameLoop() {
  if (gameState.gameOver) return drawGameOver();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState.paused) return drawPauseScreen();

  // Background scrolling
  drawBackground();

  handleInput();
  spawnDebris();
  updateGameObjects();
  renderGameObjects();

  checkCollisions();
  aliensShoot();
  spawnPowerUp(); // Spawn power-up at intervals
  checkPowerUpCollision(); // Check collision with power-up

  requestAnimationFrame(gameLoop);
}

// Draw the scrolling background
function drawBackground() {
  if (gameState.alien.killCount >= 3 && !gameState.powerUpActive) {
    ctx.drawImage(images.spaceBackground, 0, 0, canvas.width, canvas.height);
  } else {
    backgroundY += backgroundSpeed;
    if (backgroundY >= canvas.height) backgroundY = 0;

    ctx.drawImage(images.background, 0, backgroundY, canvas.width, canvas.height);
    ctx.drawImage(images.background, 0, backgroundY - canvas.height, canvas.width, canvas.height);
  }
}

// Handle player movement
function handleInput() {
  const ship = gameState.ship;
  if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
  if (keys.ArrowRight && ship.x < canvas.width - ship.width) ship.x += ship.speed;
  if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
  if (keys.ArrowDown && ship.y < canvas.height - ship.height) ship.y += ship.speed;

  if (keys.Space) shootBullet();
}

// Shoot bullets from the ship based on the weapon level (upgraded to dual lasers when power-up is active)
function shootBullet() {
  const ship = gameState.ship;

  // If the power-up is active, shoot dual bullets
  if (gameState.powerUpActive) {
    shipBullets.push({ x: ship.x + 10, y: ship.y, width: 5, height: 15 }); // Left laser
    shipBullets.push({ x: ship.x + ship.width - 15, y: ship.y, width: 5, height: 15 }); // Right laser
  } else {
    // Single bullet
    shipBullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y, width: 5, height: 15 });
  }
}

// Create random debris
function spawnDebris() {
  if (Math.random() < 0.03) {
    debrisArray.push({
      x: Math.random() * canvas.width,
      y: -100,
      width: 70 + Math.random() * 30,
      height: 80 + Math.random() * 30,
      speed: gameState.debrisSpeed
    });
  }
}

// Create alien ships for the wave
function createAlienWave() {
  alienShips = [];
  const waveCount = gameState.alien.wave * 5; // Increase the number of aliens with each wave
  for (let i = 0; i < waveCount; i++) {
    alienShips.push({
      x: Math.random() * (canvas.width - 100),
      y: -Math.random() * canvas.height / 2,
      width: 100,
      height: 100,
      speed: gameState.alien.speed
    });
  }
}

// Spawn power-up randomly
function spawnPowerUp() {
  if (!powerUp && Math.random() < 0.01) {
    powerUp = {
      x: Math.random() * (canvas.width - 50),
      y: -50,
      width: 50,
      height: 50,
      speed: 2
    };
  }

  if (powerUp) {
    powerUp.y += powerUp.speed;
    if (powerUp.y > canvas.height) {
      powerUp = null; // Remove if off-screen
    }
  }
}

// Check if the ship collides with the power-up
function checkPowerUpCollision() {
  if (!powerUp) return;

  const ship = gameState.ship;
  if (
    powerUp.x < ship.x + ship.width &&
    powerUp.x + powerUp.width > ship.x &&
    powerUp.y < ship.y + ship.height &&
    powerUp.y + powerUp.height > ship.y
  ) {
    // Collision detected
    gameState.powerUpActive = true; // Activate dual lasers
    powerUp = null; // Remove power-up
    setTimeout(() => {
      gameState.powerUpActive = false; // Power-up lasts for 10 seconds
    }, 10000);
  }
}

// Update all game objects
function updateGameObjects() {
  debrisArray.forEach(debris => (debris.y += debris.speed));
  shipBullets.forEach(bullet => (bullet.y -= gameState.bulletSpeed));
  alienShips.forEach(alien => (alien.y += gameState.alien.speed));
  alienBullets.forEach(bullet => (bullet.y += gameState.alienBulletSpeed));

  debrisArray = debrisArray.filter(debris => debris.y < canvas.height);
  shipBullets = shipBullets.filter(bullet => bullet.y > 0);
  alienShips = alienShips.filter(alien => alien.y < canvas.height);
  alienBullets = alienBullets.filter(bullet => bullet.y < canvas.height);
}

// Render all game objects
function renderGameObjects() {
  debrisArray.forEach(debris => ctx.drawImage(images.spaceDebris, debris.x, debris.y, debris.width, debris.height));
  shipBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));
  alienShips.forEach(alien => ctx.drawImage(images.alienShip, alien.x, alien.y, alien.width, alien.height));

  const ship = gameState.ship;
  ctx.drawImage(images.ship, ship.x, ship.y, ship.width, ship.height);

  // Draw lives
  for (let i = 0; i < ship.lives; i++) {
    ctx.drawImage(images.ship, 20 + i * 30, 20, 25, 25);
  }

  // Draw power-up if it exists
  if (powerUp) {
    ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
  }

  // Draw level
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Level: ${gameState.level}`, canvas.width - 150, 30);
}

// Check for collisions (only alien bullets and alien ship collisions cause damage)
function checkCollisions() {
  shipBullets.forEach((bullet, bulletIndex) => {
    alienShips.forEach((alien, alienIndex) => {
      if (
        bullet.x < alien.x + alien.width &&
        bullet.x + bullet.width > alien.x &&
        bullet.y < alien.y + alien.height &&
        bullet.y + bullet.height > alien.y
      ) {
        // Bullet hit alien
        alienShips.splice(alienIndex, 1);
        shipBullets.splice(bulletIndex, 1);
        gameState.alien.killCount++;

        // Update kill count and check for level up
        if (gameState.alien.killCount % 5 === 0) {
          gameState.level++;
          if (gameState.level > gameState.maxLevel) {
            gameState.level = gameState.maxLevel;
          }
        }
      }
    });
  });

  // Remove the debris collision detection
  /*
  debrisArray.forEach((debris, debrisIndex) => {
    if (debris.x < gameState.ship.x + gameState.ship.width && debris.x + debris.width > gameState.ship.x &&
      debris.y < gameState.ship.y + gameState.ship.height && debris.y + debris.height > gameState.ship.y) {
      // Ship hit debris
      gameState.ship.lives--;
      debrisArray.splice(debrisIndex, 1);
      if (gameState.ship.lives <= 0) {
        gameState.gameOver = true;
      }
    }
  });
  */

  // Check for collisions with alien bullets
  alienBullets.forEach((bullet, bulletIndex) => {
    if (
      bullet.x < gameState.ship.x + gameState.ship.width &&
      bullet.x + bullet.width > gameState.ship.x &&
      bullet.y < gameState.ship.y + gameState.ship.height &&
      bullet.y + bullet.height > gameState.ship.y
    ) {
      // Ship hit by alien bullet
      gameState.ship.lives--;
      alienBullets.splice(bulletIndex, 1);
      if (gameState.ship.lives <= 0) {
        gameState.gameOver = true;
      }
    }
  });
}


  debrisArray.forEach((debris, debrisIndex) => {
    if (debris.x < gameState.ship.x + gameState.ship.width && debris.x + debris.width > gameState.ship.x &&
      debris.y < gameState.ship.y + gameState.ship.height && debris.y + debris.height > gameState.ship.y) {
      // Ship hit debris
      gameState.ship.lives--;
      debrisArray.splice(debrisIndex, 1);
      if (gameState.ship.lives <= 0) {
        gameState.gameOver = true;
      }
    }
  });
}

// Function for alien shooting bullets
function aliensShoot() {
  gameState.alienFireCounter += 16; // Increase the counter based on game loop timing
  if (gameState.alienFireCounter > gameState.alienFireRate) {
    alienShips.forEach(alien => {
      if (Math.random() < 0.1) { // Adjust shooting frequency
        alienBullets.push({ x: alien.x + alien.width / 2 - 2.5, y: alien.y + alien.height, width: 5, height: 15 });
      }
    });
    gameState.alienFireCounter = 0; // Reset fire counter
  }
}

// Draw game over screen
function drawGameOver() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
}

// Draw pause screen
function drawPauseScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.fillText('Paused', canvas.width / 2 - 70, canvas.height / 2);
}

// Start the game
init();







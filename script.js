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
  background: './assets/space-background.webp'
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

let gameState = {
  debrisSpeed: 3,
  bulletSpeed: 7,
  alienBulletSpeed: 5,
  paused: false,
  gameOver: false,
  alienFireRate: 2000, // Alien bullets interval
  alienFireCounter: 0,
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

  requestAnimationFrame(gameLoop);
}

// Draw the scrolling background
function drawBackground() {
  backgroundY += backgroundSpeed;
  if (backgroundY >= canvas.height) backgroundY = 0;

  ctx.drawImage(images.background, 0, backgroundY, canvas.width, canvas.height);
  ctx.drawImage(images.background, 0, backgroundY - canvas.height, canvas.width, canvas.height);
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

// Shoot bullets from the ship based on the weapon level
function shootBullet() {
  const ship = gameState.ship;
  const bulletSpacing = 10; // Space between bullets
  const startX = ship.x + ship.width / 2 - (ship.bullets * bulletSpacing) / 2;

  for (let i = 0; i < ship.bullets; i++) {
    shipBullets.push({ x: startX + i * bulletSpacing, y: ship.y, width: 5, height: 15 });
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

  // Draw level
  ctx.fillStyle = 'white';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Level: ${gameState.level}`, canvas.width - 150, 30);
}

// Check for collisions (bullet hits alien or ship hits debris)
function checkCollisions() {
  shipBullets.forEach((bullet, bulletIndex) => {
    alienShips.forEach((alien, alienIndex) => {
      if (bullet.x < alien.x + alien.width && bullet.x + bullet.width > alien.x &&
        bullet.y < alien.y + alien.height && bullet.y + bullet.height > alien.y) {
        shipBullets.splice(bulletIndex, 1);
        alienShips.splice(alienIndex, 1);
        gameState.alien.killCount++;

        if (gameState.alien.killCount % 5 === 0) {
          gameState.alien.wave++;
          gameState.level++;
          increaseWeaponLevel();
          createAlienWave(); // Create new wave of aliens
        }
      }
    });
  });
}

// Increase weapon level (number of bullets fired)
function increaseWeaponLevel() {
  if (gameState.ship.bullets < gameState.maxLevel) {
    gameState.ship.bullets++;
  }
}

// Aliens shoot bullets
function aliensShoot() {
  gameState.alienFireCounter += gameState.alien.wave; // Increase fire rate with wave

  if (gameState.alienFireCounter > gameState.alienFireRate) {
    alienShips.forEach(alien => {
      for (let i = 0; i < gameState.alien.bulletsPerWave; i++) { // More bullets each wave
        alienBullets.push({
          x: alien.x + alien.width / 2,
          y: alien.y + alien.height,
          width: 5,
          height: 10,
        });
      }
    });
    gameState.alienFireCounter = 0; // Reset counter after shooting
  }
}

// Toggle pause
function togglePause() {
  gameState.paused = !gameState.paused;
  if (!gameState.paused) gameLoop();
}

// Reset game
function resetGame() {
  debrisArray = [];
  shipBullets = [];
  alienBullets = [];
  alienShips = [];
  gameState.ship.lives = 4;
  gameState.alien.killCount = 0;
  gameState.alien.wave = 1;
  gameState.level = 1;
  gameState.ship.bullets = 1;
  gameState.gameOver = false;
  createAlienWave();
}

// Draw game over screen
function drawGameOver() {
  ctx.fillStyle = 'red';
  ctx.font = '48px sans-serif';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
  ctx.font = '24px sans-serif';
  ctx.fillText('Press R to Restart', canvas.width / 2 - 100, canvas.height / 2 + 50);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'r' && gameState.gameOver) {
    resetGame();
  }
});

init();







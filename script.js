const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const spaceDebrisImage = new Image();
spaceDebrisImage.src = './assets/spaceDebris.webp';
const shipImage = new Image();
shipImage.src = './assets/ship.webp';
const alienShipImage = new Image();
alienShipImage.src = './assets/ship_alien.webp';
const hitImage = new Image();
hitImage.src = './assets/hit.webp';
const resetImage = new Image();
resetImage.src = './assets/reset.webp';
const killImage = new Image();
killImage.src = './assets/kill.webp';

// Variables for debris and ship
let debrisArray = [];
let debrisSpeed = 3;
let bulletSpeed = 7;
let bulletColor = 'blue';
const alienBulletSpeed = 5;
const alienBulletColor = 'red';
const alienDoubleBulletColor = 'orange';
let pause = false;
let displayHit = false;
let backgroundChanged = false;

// Game Over variables
let gameOver = false;

// Ship properties
const ship = {
  width: 80,
  height: 90,
  x: canvas.width / 2 - 40,
  y: canvas.height - 90,
  speed: 7,
  bullets: [],
  lives: 4,
  bulletCount: 1,
  image: shipImage
};

// Alien ship properties
const alienShip = {
  width: 100,
  height: 100,
  speed: 2,
  image: alienShipImage,
  ships: [],
  bullets: [],
  killCount: 0,
  wave: 1,
  aliensPerWave: 6
};

// Key states for movement
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false
};

// Function to create debris
function createDebris() {
  const debris = {
    x: Math.random() * canvas.width,
    y: -100,
    width: 40 + Math.random() * 30,
    height: 40 + Math.random() * 30,
    speed: debrisSpeed + Math.random() * 2
  };
  debrisArray.push(debris);
}

// Function to draw all debris
function drawDebris() {
  debrisArray.forEach(debris => {
    ctx.drawImage(spaceDebrisImage, debris.x, debris.y, debris.width, debris.height);
  });
}

// Move debris
function moveDebris() {
  debrisArray.forEach(debris => {
    debris.y += debris.speed;
  });
  debrisArray = debrisArray.filter(debris => debris.y < canvas.height);
}

// Spawn debris at random intervals
function spawnDebrisRandomly() {
  if (Math.random() < 0.03) {
    createDebris();
  }
}

// Function to update background based on kill count
function updateBackground() {
  if (alienShip.killCount >= 9 && !backgroundChanged) {
    canvas.style.backgroundImage = "url('./assets/space-background.gif')";
    backgroundChanged = true;
  } else if (alienShip.killCount < 9 && backgroundChanged) {
    canvas.style.backgroundImage = "";
    backgroundChanged = false;
  }
}

// Keydown and keyup listeners for movement, shooting, and pausing
document.addEventListener('keydown', event => {
  if (event.code in keys) keys[event.code] = true;

  if (event.code === 'Space' && !pause && !gameOver) {
    event.preventDefault();
    shootBullet();
  }

  if (event.code === 'KeyP') {
    togglePause();
  }
});

document.addEventListener('keyup', event => {
  if (event.code in keys) keys[event.code] = false;
});

// Ship movement
function handleMovement() {
  if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
  if (keys.ArrowRight && ship.x < canvas.width - ship.width) ship.x += ship.speed;
  if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
  if (keys.ArrowDown && ship.y < canvas.height - ship.height) ship.y += ship.speed;
}

// Shoot bullet
function shootBullet() {
  const spacing = 10;
  for (let i = 0; i < ship.bulletCount; i++) {
    ship.bullets.push({
      x: ship.x + ship.width / 2 - 2.5 - ((ship.bulletCount - 1) * spacing) / 2 + i * spacing,
      y: ship.y
    });
  }
}

// Draw the ship
function drawShip() {
  ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = bulletColor;
  ship.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

// Move bullets
function moveBullets() {
  ship.bullets.forEach(bullet => {
    bullet.y -= bulletSpeed;
  });
  ship.bullets = ship.bullets.filter(bullet => bullet.y > 0);
}

// Draw ship lives
function drawLives() {
  const lifeWidth = 25;
  const lifeHeight = 25;
  const lifeMargin = 10;

  for (let i = 0; i < ship.lives; i++) {
    const x = lifeMargin + (lifeWidth + lifeMargin) * i;
    const y = lifeMargin;
    ctx.drawImage(ship.image, x, y, lifeWidth, lifeHeight);
  }
}

// Create alien ships
function createAliens() {
  alienShip.ships = [];
  for (let i = 0; i < alienShip.aliensPerWave; i++) {
    alienShip.ships.push({
      x: Math.random() * (canvas.width - alienShip.width),
      y: -Math.random() * canvas.height / 2,
      hasFired: false
    });
  }
}

// Draw alien ships
function drawAliens() {
  alienShip.ships.forEach(alien => {
    ctx.drawImage(alienShip.image, alien.x, alien.y, alienShip.width, alienShip.height);
  });
}

// Show "kill" image briefly when an alien is destroyed
function showKillEffect(x, y) {
  ctx.drawImage(killImage, x, y, alienShip.width, alienShip.height);
  setTimeout(() => {
    ctx.clearRect(x, y, alienShip.width, alienShip.height);
  }, 500);
}

// Move alien ships and fire bullets
function moveAliens() {
  alienShip.ships.forEach(alien => {
    alien.y += alienShip.speed;

    if (!alien.hasFired && alien.y > 0) {
      const firingChance = alienShip.wave >= 2 ? 0.1 : 0.05;
      if (Math.random() < firingChance) {
        if (alienShip.wave >= 2 && Math.random() < 0.5) {
          alienShip.bullets.push({ x: alien.x + alienShip.width / 2 - 2.5, y: alien.y + alienShip.height, color: alienDoubleBulletColor });
        } else {
          alienShip.bullets.push({ x: alien.x + alienShip.width / 2 - 2.5, y: alien.y + alienShip.height });
        }
        alien.hasFired = true;
      }
    }
    if (alien.y >= canvas.height) alien.hasFired = false;
  });
  alienShip.ships = alienShip.ships.filter(alien => alien.y < canvas.height);
}

// Draw alien bullets
function drawAlienBullets() {
  alienShip.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color || alienBulletColor;
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

// Move alien bullets
function moveAlienBullets() {
  alienShip.bullets.forEach(bullet => {
    bullet.y += alienBulletSpeed;
  });
  alienShip.bullets = alienShip.bullets.filter(bullet => bullet.y < canvas.height);
}

// Check for bullet-alien collisions
function checkBulletAlienCollision() {
  for (let i = alienShip.ships.length - 1; i >= 0; i--) {
    const alien = alienShip.ships[i];
    for (let j = ship.bullets.length - 1; j >= 0; j--) {
      const bullet = ship.bullets[j];
      if (
        bullet.x < alien.x + alienShip.width &&
        bullet.x + 5 > alien.x &&
        bullet.y < alien.y + alienShip.height &&
        bullet.y + 15 > alien.y
      ) {
        ship.bullets.splice(j, 1);  // Remove the bullet
        alienShip.ships.splice(i, 1);  // Remove the alien
        alienShip.killCount++;
        showKillEffect(alien.x, alien.y);  // Show the kill effect
        updateBulletProgression();  // Update bullet color and speed
        return;
      }
    }
  }
}

// Function to update bullet progression
function updateBulletProgression() {
  if (alienShip.killCount >= 9) {
    bulletSpeed += 1;
    bulletColor = 'green';
    if (alienShip.killCount >= 15) {
      ship.bulletCount++;
      bulletColor = 'yellow';
    }
  }
}

// Check if all aliens are destroyed
function checkAllAliensDestroyed() {
  return alienShip.ships.length === 0;
}

// Increment wave count and create new aliens
function nextWave() {
  alienShip.wave++;
  alienShip.aliensPerWave += 2; // Increase aliens per wave
  createAliens(); // Create new wave of aliens
}

// Toggle pause state
function togglePause() {
  pause = !pause;
}

// Draw game over message
function drawGameOver() {
  ctx.fillStyle = 'red';
  ctx.font = '48px Arial';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
}

// Main game loop
function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleMovement();
  drawDebris();
  drawShip();
  drawBullets();
  drawLives();

  moveBullets();
  moveDebris();
  spawnDebrisRandomly();
  
  if (!pause) {
    moveAliens();
    drawAliens();
    moveAlienBullets();
    drawAlienBullets();
    checkBulletAlienCollision();
    
    if (checkAllAliensDestroyed()) {
      nextWave(); // Move to the next wave
    }
  }

  updateBackground();
  
  if (ship.lives <= 0) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

// Initialize game
function startGame() {
  alienShip.wave = 1;
  alienShip.aliensPerWave = 6; // Initial number of aliens
  alienShip.killCount = 0; // Reset kill count
  ship.lives = 4; // Reset lives
  ship.bullets = [];
  createAliens(); // Create the first wave of aliens
  gameLoop(); // Start the main game loop
}

// Start the game when the page is loaded
window.onload = startGame;









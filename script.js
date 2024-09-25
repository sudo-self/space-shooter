const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ship object
const ship = {
  width: 50,
  height: 50,
  x: canvas.width / 2 - 25,
  y: canvas.height - 90,
  speed: 5,
  bullets: [],
  lives: 3,
  image: new Image()
};
ship.image.src = './assets/ship.webp';

// Alien Ship object
const alienShip = {
  width: 100,
  height: 100,
  speed: 2,
  image: new Image(),
  ships: [],
  bullets: [],
  killCount: 0
};
alienShip.image.src = './assets/ship_alien.webp';

// Bullet properties
let bulletSpeed = 7;
let bulletColor = 'green';
const alienBulletSpeed = 5;
const alienBulletColor = 'red';

// Game state variables
let isDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let pause = false;

// Touch event: start dragging the ship
canvas.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;

  // Check if the touch is on the ship
  if (
    touchX >= ship.x &&
    touchX <= ship.x + ship.width &&
    touchY >= ship.y &&
    touchY <= ship.y + ship.height
  ) {
    isDragging = true;
    touchStartX = touchX - ship.x;
    touchStartY = touchY - ship.y;
  } else {
    // Tap to shoot if touch is not on the ship
    shootBullet();
  }
});

// Handle dragging the ship
canvas.addEventListener('touchmove', (event) => {
  if (isDragging) {
    const touch = event.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Move the ship based on touch position
    ship.x = touchX - touchStartX;
    ship.y = touchY - touchStartY;

    // Keep the ship within canvas bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x > canvas.width - ship.width) ship.x = canvas.width - ship.width;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > canvas.height - ship.height) ship.y = canvas.height - ship.height;
  }
});

// Stop dragging the ship
canvas.addEventListener('touchend', () => {
  isDragging = false;
});

// Shoot bullets
function shootBullet() {
  if (!pause) {
    if (alienShip.killCount >= 9) {
      // Two bullets after 9 kills
      ship.bullets.push({ x: ship.x + 10, y: ship.y });
      ship.bullets.push({ x: ship.x + ship.width - 30, y: ship.y });
    } else {
      ship.bullets.push({
        x: ship.x + ship.width / 2 - 2.5,
        y: ship.y
      });
    }
  }
}

// Draw the ship
function drawShip() {
  ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
}

// Draw ship bullets
function drawBullets() {
  ctx.fillStyle = bulletColor;
  ship.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

// Move ship bullets
function moveBullets() {
  ship.bullets.forEach(bullet => {
    bullet.y -= bulletSpeed;
  });
  ship.bullets = ship.bullets.filter(bullet => bullet.y > 0);
}

// Draw lives on top left corner
function drawLives() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Lives: ${ship.lives}`, 10, 30);
}

// Draw the score on top right corner
function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width - 100, 30);
}

// Create alien ships
function createAlienShips() {
  if (alienShip.ships.length < 5) { // Limit the number of alien ships
    const alien = {
      x: Math.random() * (canvas.width - alienShip.width),
      y: Math.random() * 200, // Position them at the top of the canvas
      width: alienShip.width,
      height: alienShip.height,
      isAlive: true
    };
    alienShip.ships.push(alien);
  }
}

// Draw alien ships
function drawAlienShips() {
  alienShip.ships.forEach((alien) => {
    if (alien.isAlive) {
      ctx.drawImage(alienShip.image, alien.x, alien.y, alien.width, alien.height);
    }
  });
}

// Move alien ships and check for collisions with bullets
function moveAlienShips() {
  alienShip.ships.forEach((alien) => {
    if (alien.isAlive) {
      alien.y += alienShip.speed;

      // Check for collisions with ship bullets
      ship.bullets.forEach((bullet, bulletIndex) => {
        if (
          bullet.x >= alien.x &&
          bullet.x <= alien.x + alien.width &&
          bullet.y <= alien.y + alien.height
        ) {
          // Remove the bullet and mark the alien as dead
          ship.bullets.splice(bulletIndex, 1);
          alien.isAlive = false;
          alienShip.killCount++;
          score += 10; // Increment score for each kill
        }
      });
    }
  });

  // Remove dead aliens
  alienShip.ships = alienShip.ships.filter(alien => alien.isAlive);
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawShip();
  drawBullets();
  drawLives();
  drawScore();
  createAlienShips();
  drawAlienShips();
  moveBullets();
  moveAlienShips();

  // Request the next frame
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();





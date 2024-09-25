const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ship = {
  width: 50,
  height: 50,
  x: canvas.width / 2 - 40,
  y: canvas.height - 90,
  speed: 5,
  bullets: [],
  lives: 3
};
ship.image = new Image();
ship.image.src = './assets/ship.webp';

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

let bulletSpeed = 7;
let bulletColor = 'green';
const alienBulletSpeed = 5;
const alienBulletColor = 'red';

let isDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let pause = false;

// Detect touchstart to start dragging the ship
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
    // If it's not on the ship, consider it a tap to shoot
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

    // Keep the ship within the canvas bounds
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

// Movement and collision logic remains the same as before

function drawShip() {
  ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
}

function drawBullets() {
  ctx.fillStyle = bulletColor;
  ship.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

function moveBullets() {
  ship.bullets.forEach(bullet => {
    bullet.y -= bulletSpeed;
  });
  ship.bullets = ship.bullets.filter(bullet => bullet.y > 0);
}

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

function createAliens() {
  const numberOfWaves = 2;
  const aliensPerWave = 5;
  alienShip.ships = [];
  for (let waveNum = 0; waveNum < numberOfWaves; waveNum++) {
    for (let i = 0; i < aliensPerWave; i++) {
      alienShip.ships.push({
        x: Math.random() * (canvas.width - alienShip.width),
        y: -Math.random() * canvas.height,
        hasFired: false
      });
    }
  }
}

// Remaining game logic and functions...

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pause) {
    moveBullets();
    moveAliens();
    moveAlienBullets();
    checkBulletAlienCollision();
    updateBulletColor();
    checkCollision();

    drawShip();
    drawBullets();
    drawAliens();
    drawAlienBullets();
    drawLives();
  }

  requestAnimationFrame(animate);
}

createAliens();
animate();



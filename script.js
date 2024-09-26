const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ship object with properties
const ship = {
  width: 80,
  height: 90,
  x: canvas.width / 2 - 40,
  y: canvas.height - 90,
  speed: 7,
  image: new Image(),
  bullets: [],
  lives: 4,
  bulletCount: 1
};

// Ship image
ship.image.src = './assets/ship.webp';

// Alien ship object with properties
const alienShip = {
  width: 100,
  height: 100,
  speed: 2,
  image: new Image(),
  ships: [],
  bullets: [],
  killCount: 0,
  wave: 1,
  aliensPerWave: 6,
};
alienShip.image.src = './assets/ship_alien.webp';

// Extra images for hit and kill effects
const hitImage = new Image();
hitImage.src = './assets/hit.webp';
const resetImage = new Image();
resetImage.src = './assets/reset.webp';
const killImage = new Image();
killImage.src = './assets/kill.webp';

// Bullet properties
let bulletSpeed = 7;
let bulletColor = 'blue';
const alienBulletSpeed = 5;
const alienBulletColor = 'red';
const alienDoubleBulletColor = 'orange'; // New bullet color for double bullets

// Key states for movement
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false
};

let pause = false;
let displayHit = false;
let displayReset = false;

// Keydown and keyup listeners for movement, shooting, and pausing
document.addEventListener('keydown', event => {
  if (event.code in keys) {
    keys[event.code] = true;
  }

  if (event.code === 'Space' && !pause) {
    event.preventDefault();
    shootBullet();
  }

  if (event.code === 'KeyP') {
    togglePause();
  }
});

document.addEventListener('keyup', event => {
  if (event.code in keys) {
    keys[event.code] = false;
  }
});

// Handle ship movement
function handleMovement() {
  if (keys.ArrowLeft && ship.x > 0) {
    ship.x -= ship.speed;
  }
  if (keys.ArrowRight && ship.x < canvas.width - ship.width) {
    ship.x += ship.speed;
  }
  if (keys.ArrowUp && ship.y > 0) {
    ship.y -= ship.speed;
  }
  if (keys.ArrowDown && ship.y < canvas.height - ship.height) {
    ship.y += ship.speed;
  }
}

// Shooting bullets from the ship
function shootBullet() {
  if (!pause) {
    const spacing = 10;
    for (let i = 0; i < ship.bulletCount; i++) {
      ship.bullets.push({
        x: ship.x + ship.width / 2 - 2.5 - ((ship.bulletCount - 1) * spacing) / 2 + i * spacing,
        y: ship.y
      });
    }
  }
}

// Drawing the ship
function drawShip() {
  ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
}

// Drawing and moving bullets
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

// Drawing the lives as mini ships
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

// Creating and drawing alien ships
function createAliens() {
  alienShip.ships = [];
  for (let i = 0; i < alienShip.aliensPerWave; i++) {
    alienShip.ships.push({
      x: Math.random() * (canvas.width - alienShip.width),
      y: -Math.random() * canvas.height / 2,
      hasFired: false,
      image: alienShip.image.src
    });
  }
}

function drawAliens() {
  alienShip.ships.forEach(alien => {
    ctx.drawImage(alien.image === killImage.src ? killImage : alienShip.image, alien.x, alien.y, alienShip.width, alienShip.height);
  });
}

// Moving alien ships and firing bullets
function moveAliens() {
  alienShip.ships.forEach(alien => {
    alien.y += alienShip.speed;

    if (!alien.hasFired && alien.y > 0) {
      const firingChance = alienShip.wave >= 2 ? 0.1 : 0.05; // Higher firing chance on wave 2
      if (Math.random() < firingChance) {
        if (alienShip.wave >= 2 && Math.random() < 0.5) { // 50% chance of double bullets
          alienShip.bullets.push({ x: alien.x + alienShip.width / 2 - 2.5, y: alien.y + alienShip.height, color: alienDoubleBulletColor });
          alienShip.bullets.push({ x: alien.x + alienShip.width / 2 - 2.5, y: alien.y + alienShip.height, color: alienDoubleBulletColor });
        } else {
          alienShip.bullets.push({ x: alien.x + alienShip.width / 2 - 2.5, y: alien.y + alienShip.height });
        }
        alien.hasFired = true;
      }
    }

    if (alien.y >= canvas.height) {
      alien.hasFired = false;
    }
  });

  alienShip.ships = alienShip.ships.filter(alien => alien.y < canvas.height);
}

// Drawing and moving alien bullets
function drawAlienBullets() {
  alienShip.bullets.forEach(bullet => {
    ctx.fillStyle = bullet.color || alienBulletColor;
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

function moveAlienBullets() {
  alienShip.bullets.forEach(bullet => {
    bullet.y += alienBulletSpeed;
  });
  alienShip.bullets = alienShip.bullets.filter(bullet => bullet.y < canvas.height);
}

// Checking for bullet-alien collisions
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
        alienShip.killCount++;
        ship.bullets.splice(j, 1);
        alienShip.ships.splice(i, 1);
        updateBulletColor();
        updateKillCountDisplay();
        break;
      }
    }
  }
}

// Displaying and updating the kill count
function updateKillCountDisplay() {
  document.getElementById('killCount').innerText = `Kills: ${alienShip.killCount}`;
}

// Bullet color and speed upgrade logic based on kill count
function updateBulletColor() {
  if (alienShip.killCount >= 20) {
    bulletColor = '#00FF26'; 
    bulletSpeed = 20;
    ship.bulletCount = 4; // Quad bullets
  } else if (alienShip.killCount >= 10) { 
    bulletColor = '#BC13FE';
    bulletSpeed = 18;
    ship.bulletCount = 3;
  } else if (alienShip.killCount >= 5) { 
    bulletColor = '#FF11FF'; 
    bulletSpeed = 14;
    ship.bulletCount = 2; 
  } else {
    bulletColor = '#04d9FF'; 
    bulletSpeed = 7;
    ship.bulletCount = 1; 
  }
}

// Checking for collisions between alien bullets and ship
function checkCollision() {
  for (let i = alienShip.bullets.length - 1; i >= 0; i--) {
    const bullet = alienShip.bullets[i];
    if (
      bullet.x < ship.x + ship.width &&
      bullet.x + 5 > ship.x &&
      bullet.y < ship.y + ship.height &&
      bullet.y + 15 > ship.y
    ) {
      ship.lives--;
      displayHit = true; 
      setTimeout(() => {
        displayHit = false; 
      }, 500); 
      alienShip.bullets.splice(i, 1); 
      alienShip.killCount = Math.max(0, alienShip.killCount - 5); 
      updateKillCountDisplay();
      break;
    }
  }
}

// Draw reset effect on hit
function drawResetEffect() {
  ctx.drawImage(resetImage, ship.x, ship.y, ship.width, ship.height);
}

// Handle game over conditions
function checkGameOver() {
  if (ship.lives <= 0) {
    pause = true; 
    ctx.font = '48px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
    ctx.fillText('Press R to restart', canvas.width / 2 - 150, canvas.height / 2 + 50);
  }
}

// Restarting the game
function restartGame() {
  ship.lives = 4;
  alienShip.killCount = 0;
  alienShip.wave = 1;
  alienShip.aliensPerWave = 6;
  ship.bullets = [];
  alienShip.ships = [];
  alienShip.bullets = [];
  bulletSpeed = 7;
  bulletColor = 'blue';
  ship.bulletCount = 1;
  createAliens();
  pause = false;
  updateKillCountDisplay();
}

// Toggling pause state
function togglePause() {
  pause = !pause;
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleMovement();
  
  if (!pause) {
    drawShip();
    moveBullets();
    drawBullets();
    moveAliens();
    drawAliens();
    moveAlienBullets();
    drawAlienBullets();
    checkBulletAlienCollision();
    checkCollision();
    checkGameOver();
    
    if (displayHit) {
      drawResetEffect(); 
    }
    
    if (alienShip.ships.length === 0) {
      alienShip.wave++;
      alienShip.aliensPerWave += 2;
      createAliens();
    }
  } else {
    ctx.font = '36px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Paused', canvas.width / 2 - 50, canvas.height / 2);
  }
  
  drawLives();
  requestAnimationFrame(gameLoop);
}

// Start the game
createAliens();
gameLoop();












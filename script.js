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
hitImage.src = './assets/hit.webp';  // Correcting this
const resetImage = new Image();
resetImage.src = './assets/reset.webp';
const killImage = new Image();
killImage.src = './assets/kill.webp';  // Ensuring this image is shown briefly on alien destruction

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
let backgroundChanged = false;  // Track background change

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
    canvas.style.backgroundImage = "url('./assets/space-background.gif')";  // Change background after certain kills
    backgroundChanged = true;  // Ensure background changes only once
  } else if (alienShip.killCount < 9 && backgroundChanged) {
    canvas.style.backgroundImage = "";  // Revert to normal if below kill count
    backgroundChanged = false;
  }
}

// Keydown and keyup listeners for movement, shooting, and pausing
document.addEventListener('keydown', event => {
  if (event.code in keys) keys[event.code] = true;

  if (event.code === 'Space' && !pause) {
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
    ctx.drawImage(alien.image, alien.x, alien.y, alienShip.width, alienShip.height);
  });
}

// Show "kill" image briefly when an alien is destroyed
function showKillEffect(x, y) {
  ctx.drawImage(killImage, x, y, alienShip.width, alienShip.height);
  setTimeout(() => {
    ctx.clearRect(x, y, alienShip.width, alienShip.height);  // Clear after showing "kill" effect
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
    bulletColor = 'purple';
    bulletSpeed = 10;
    ship.bulletCount = 3;
  } else if (alienShip.killCount >= 6) {
    bulletColor = 'red';
    bulletSpeed = 9;
    ship.bulletCount = 2;
  } else if (alienShip.killCount >= 3) {
    bulletColor = 'yellow';
    bulletSpeed = 8;
    ship.bulletCount = 1;
  } else {
    bulletColor = 'blue';
    bulletSpeed = 7;
    ship.bulletCount = 1;
  }
}

// Toggle pause functionality
function togglePause() {
  pause = !pause;
}

// Game loop
function gameLoop() {
  if (!pause) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDebris();
    moveDebris();
    drawShip();
    drawBullets();
    moveBullets();
    drawLives();
    drawAliens();
    moveAliens();
    drawAlienBullets();
    moveAlienBullets();
    checkBulletAlienCollision();
    spawnDebrisRandomly();
    updateBackground();
  }
  requestAnimationFrame(gameLoop);
}

// Start the game once all images are loaded
spaceDebrisImage.onload = function() {
  shipImage.onload = function() {
    alienShipImage.onload = function() {
      hitImage.onload = function() {
        resetImage.onload = function() {
          killImage.onload = function() {
            createAliens();
            gameLoop();
          };
        };
      };
    };
  };
};














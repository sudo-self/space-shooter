const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ship = {
  width: 50,
  height: 50,
  x: canvas.width / 2 - 40,
  y: canvas.height - 90,
  speed: 5,
  image: new Image(),
  bullets: [],
  lives: 3
};
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

const killImage = new Image();
killImage.src = './assets/kill.webp';

let bulletSpeed = 7;
let bulletColor = 'green';

const alienBulletSpeed = 5;
const alienBulletColor = 'red';

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false
};

let pause = false;
let wave = 1;

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
        hasFired: false // Initialize hasFired property
      });
    }
  }
}

function drawAliens() {
  alienShip.ships.forEach(alien => {
    ctx.drawImage(alienShip.image, alien.x, alien.y, alienShip.width, alienShip.height);
  });
}

function moveAliens() {
  alienShip.ships.forEach(alien => {
    alien.y += alienShip.speed;

    // Only fire bullets if the alien has not already fired
    if (!alien.hasFired) {
      if (wave === 1 && Math.random() < 0.02) {
        alienShip.bullets.push({
          x: alien.x + alienShip.width / 2 - 2.5,
          y: alien.y + alienShip.height
        });
        alien.hasFired = true;
      } else if (wave === 2 && Math.random() < 0.05) {
        alienShip.bullets.push({
          x: alien.x + alienShip.width / 2 - 2.5,
          y: alien.y + alienShip.height
        });
        alien.hasFired = true;
      } else if (wave >= 3 && Math.random() < 0.1) {
        alienShip.bullets.push({
          x: alien.x + alienShip.width / 2 - 2.5,
          y: alien.y + alienShip.height
        });
        alien.hasFired = true;
      }
    }

    // Reset firing status if the alien goes off-screen
    if (alien.y >= canvas.height) {
      alien.hasFired = false;
    }
  });

  alienShip.ships = alienShip.ships.filter(alien => alien.y < canvas.height);
}

function drawAlienBullets() {
  ctx.fillStyle = alienBulletColor;
  alienShip.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, 5, 15);
  });
}

function moveAlienBullets() {
  alienShip.bullets.forEach(bullet => {
    bullet.y += alienBulletSpeed;
  });
  alienShip.bullets = alienShip.bullets.filter(bullet => bullet.y < canvas.height);
}

function checkBulletAlienCollision() {
  for (let i = 0; i < alienShip.ships.length; i++) {
    const alien = alienShip.ships[i];
    for (let j = 0; j < ship.bullets.length; j++) {
      const bullet = ship.bullets[j];

      if (
        bullet.x < alien.x + alienShip.width &&
        bullet.x + 5 > alien.x &&
        bullet.y < alien.y + alienShip.height &&
        bullet.y + 15 > alien.y
      ) {
        alienShip.ships.splice(i, 1);
        ship.bullets.splice(j, 1);
        alienShip.killCount++;
        updateBulletColor();
        drawKillImage(alien.x, alien.y);
        updateKillCountDisplay();
        break;
      }
    }
  }
}

function drawKillImage(x, y) {
  ctx.drawImage(killImage, x, y, 50, 50);
}

function updateKillCountDisplay() {
  document.getElementById('killCount').innerText = `Kills: ${alienShip.killCount}`;
}

function updateBulletColor() {
  if (alienShip.killCount >= 6) {
    bulletColor = 'yellow';
    bulletSpeed = 14;
  }
}

function checkCollision() {
  alienShip.bullets.forEach(bullet => {
    if (
      bullet.x < ship.x + ship.width &&
      bullet.x + 5 > ship.x &&
      bullet.y < ship.y + ship.height &&
      bullet.y + 15 > ship.y
    ) {
      ship.lives--;
      if (ship.lives <= 0) {
        endGame();
      }
      alienShip.bullets = alienShip.bullets.filter(b => b !== bullet);
    }
  });
}

function endGame() {
  pause = true;
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

function drawPauseMenu() {
  if (pause) {
    document.getElementById('pauseMenu').style.display = 'block';
  } else {
    document.getElementById('pauseMenu').style.display = 'none';
  }
}

function togglePause() {
  pause = !pause;
  drawPauseMenu();
}

function update() {
  if (!pause) {
    handleMovement();
    moveBullets();
    moveAliens();
    moveAlienBullets();
    checkBulletAlienCollision();
    checkCollision();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShip();
    drawBullets();
    drawAliens();
    drawAlienBullets();
    drawLives();
  }
}

function gameLoop() {
  update();
  requestAnimationFrame(gameLoop);
}

createAliens();
gameLoop();








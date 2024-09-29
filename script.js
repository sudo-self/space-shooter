const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


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


let gameOver = false;


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


const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false
};


function createDebris() {
  const debris = {
    x: Math.random() * canvas.width,
    y: -100,
    width: 70 + Math.random() * 30,
    height: 80 + Math.random() * 30,
    speed: debrisSpeed + Math.random() * 2
  };
  debrisArray.push(debris);
}


function drawDebris() {
  debrisArray.forEach(debris => {
    ctx.drawImage(spaceDebrisImage, debris.x, debris.y, debris.width, debris.height);
  });
}


function moveDebris() {
  debrisArray.forEach(debris => {
    debris.y += debris.speed;
  });
  debrisArray = debrisArray.filter(debris => debris.y < canvas.height);
}


function spawnDebrisRandomly() {
  if (Math.random() < 0.03) {
    createDebris();
  }
}


function updateBackground() {
  if (alienShip.killCount >= 9 && !backgroundChanged) {
    canvas.style.backgroundImage = "url('./assets/space-background.gif')";
    backgroundChanged = true;
  } else if (alienShip.killCount < 9 && backgroundChanged) {
    canvas.style.backgroundImage = "";
    backgroundChanged = false;
  }
}


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


function handleMovement() {
  if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
  if (keys.ArrowRight && ship.x < canvas.width - ship.width) ship.x += ship.speed;
  if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
  if (keys.ArrowDown && ship.y < canvas.height - ship.height) ship.y += ship.speed;
}


function shootBullet() {
  const spacing = 10;
  for (let i = 0; i < ship.bulletCount; i++) {
    ship.bullets.push({
      x: ship.x + ship.width / 2 - 2.5 - ((ship.bulletCount - 1) * spacing) / 2 + i * spacing,
      y: ship.y
    });
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
  alienShip.ships = [];
  for (let i = 0; i < alienShip.aliensPerWave; i++) {
    alienShip.ships.push({
      x: Math.random() * (canvas.width - alienShip.width),
      y: -Math.random() * canvas.height / 2,
      hasFired: false
    });
  }
}


function drawAliens() {
  alienShip.ships.forEach(alien => {
    ctx.drawImage(alienShip.image, alien.x, alien.y, alienShip.width, alienShip.height);
  });
}


function showKillEffect(x, y) {
  ctx.drawImage(killImage, x, y, alienShip.width, alienShip.height);
  setTimeout(() => {
    ctx.clearRect(x, y, alienShip.width, alienShip.height);
  }, 2000);
}


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
        console.log('Collision detected!');

        ship.bullets.splice(j, 1); 
        alienShip.ships.splice(i, 1);  
        alienShip.killCount++; 
        console.log('Kill count:', alienShip.killCount);

        showKillEffect(alien.x, alien.y);  
        updateBulletProgression(); 
        return;
      }
    }
  }
}


function updateBulletProgression() {
  if (alienShip.killCount === 3) {
    ship.bulletCount = 2;  
    bulletColor = 'green';  
  } else if (alienShip.killCount === 6) {
    bulletSpeed = 10; 
  } else if (alienShip.killCount === 9) {
    ship.lives++; 
  } else if (alienShip.killCount >= 12) {

  }
}

function checkShipCollision() {
  for (let i = 0; i < alienShip.bullets.length; i++) {
    const bullet = alienShip.bullets[i];
    if (
      bullet.x < ship.x + ship.width &&
      bullet.x + 5 > ship.x &&
      bullet.y < ship.y + ship.height &&
      bullet.y + 15 > ship.y
    ) {
      ship.lives--;
      alienShip.bullets.splice(i, 1); 
      if (ship.lives <= 0) {
        gameOver = true;
      }
      return;
    }
  }
}


function resetGame() {
  ship.lives = 4;
  ship.bullets = [];
  alienShip.ships = [];
  alienShip.bullets = [];
  alienShip.killCount = 0;
  alienShip.wave = 1;
  gameOver = false;
  backgroundChanged = false;
  document.getElementById('gameOverText').style.display = 'none'; 
}


function drawGameOverText() {
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.fillText('Game Over!', canvas.width / 2 - 120, canvas.height / 2);
}


function gameLoop() {
  if (gameOver) {
    drawGameOverText();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);  

 if (pause) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px sans-serif';
  ctx.fillText('Paused', canvas.width / 2 - 70, canvas.height / 2);
  return;
}


  handleMovement();
  spawnDebrisRandomly();
  drawDebris();
  moveDebris();

  drawShip();
  drawBullets();
  moveBullets();
  checkBulletAlienCollision();
  drawLives();

  if (alienShip.ships.length === 0) {
    alienShip.wave++;
    alienShip.aliensPerWave += 4; 
    createAliens(); 
  }

  moveAliens();
  drawAliens();
  moveAlienBullets();
  drawAlienBullets();
  checkShipCollision();
  updateBackground();

  requestAnimationFrame(gameLoop); 
}


function togglePause() {
  pause = !pause;
  
  if (!pause && !gameOver) {
    requestAnimationFrame(gameLoop); 
  }
}


createAliens(); 
gameLoop(); 











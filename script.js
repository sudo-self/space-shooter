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
    background: './assets/space-background.jpg',
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
let powerUp = null;

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

// Add keyboard event listeners
document.addEventListener('keydown', (e) => (keys[e.code] = true));
document.addEventListener('keyup', (e) => (keys[e.code] = false));

// Add touch event listeners for mobile movement
let touchStartX = 0;
let touchStartY = 0;
let shipInitialX = 0;
let shipInitialY = 0;

// Touch start event - capture the initial touch position and the ship's initial position
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    shipInitialX = gameState.ship.x;
    shipInitialY = gameState.ship.y;

    // Tap to shoot on mobile
    shootBullet(); // Fire a bullet when the screen is tapped
});

// Touch move event - move the ship based on the touch movement
canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Update the ship's position based on the movement delta
    gameState.ship.x = shipInitialX + deltaX;
    gameState.ship.y = shipInitialY + deltaY;

    // Ensure the ship stays within the canvas bounds
    if (gameState.ship.x < 0) gameState.ship.x = 0;
    if (gameState.ship.x > canvas.width - gameState.ship.width) gameState.ship.x = canvas.width - gameState.ship.width;
    if (gameState.ship.y < 0) gameState.ship.y = 0;
    if (gameState.ship.y > canvas.height - gameState.ship.height) gameState.ship.y = canvas.height - gameState.ship.height;

    e.preventDefault(); // Prevent scrolling
});

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

    drawBackground();
    handleInput();
    spawnDebris();
    updateGameObjects();
    renderGameObjects();
    checkCollisions();
    aliensShoot();
    spawnPowerUp();
    checkPowerUpCollision();

    requestAnimationFrame(gameLoop);
}

// Start the game
init();

// Background scrolling
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

// Shoot bullets from the ship
function shootBullet() {
    const ship = gameState.ship;
    if (gameState.powerUpActive) {
        shipBullets.push({ x: ship.x + 10, y: ship.y, width: 5, height: 15 }); // Left laser
        shipBullets.push({ x: ship.x + ship.width - 15, y: ship.y, width: 5, height: 15 }); // Right laser
    } else {
        shipBullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y, width: 5, height: 15 });
    }
}

// Spawn debris randomly
function spawnDebris() {
    if (Math.random() < 0.02) {
        debrisArray.push({ x: Math.random() * canvas.width, y: 0, width: 30, height: 30 });
    }
}

// Update game objects
function updateGameObjects() {
    // Update debris
    for (let i = 0; i < debrisArray.length; i++) {
        debrisArray[i].y += gameState.debrisSpeed;
        if (debrisArray[i].y > canvas.height) {
            debrisArray.splice(i, 1);
            i--;
        }
    }

    // Update ship bullets
    for (let i = 0; i < shipBullets.length; i++) {
        shipBullets[i].y -= gameState.bulletSpeed;
        if (shipBullets[i].y < 0) {
            shipBullets.splice(i, 1);
            i--;
        }
    }

    // Update alien bullets
    for (let i = 0; i < alienBullets.length; i++) {
        alienBullets[i].y += gameState.alienBulletSpeed;
        if (alienBullets[i].y > canvas.height) {
            alienBullets.splice(i, 1);
            i--;
        }
    }

    // Update alien ships
    for (let i = 0; i < alienShips.length; i++) {
        alienShips[i].y += gameState.alien.speed;
        if (alienShips[i].y > canvas.height) {
            alienShips.splice(i, 1);
            i--;
        }
    }

    // Update power-up
    if (powerUp) {
        powerUp.y += 3;
        if (powerUp.y > canvas.height) {
            powerUp = null;
        }
    }
}

// Render game objects
function renderGameObjects() {
    // Draw debris
    for (const debris of debrisArray) {
        ctx.drawImage(images.spaceDebris, debris.x, debris.y, debris.width, debris.height);
    }

    // Draw ship bullets
    for (const bullet of shipBullets) {
        ctx.fillStyle = 'green';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien bullets
    for (const bullet of alienBullets) {
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien ships
    for (const alien of alienShips) {
        ctx.drawImage(images.alienShip, alien.x, alien.y, alien.width, alien.height);
    }

    // Draw the player ship
    ctx.drawImage(images.ship, gameState.ship.x, gameState.ship.y, gameState.ship.width, gameState.ship.height);

    // Draw power-up
    if (powerUp) {
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
}

// Create a wave of alien ships
function createAlienWave() {
    const count = Math.min(gameState.alien.bulletsPerWave + gameState.level - 1, 10);
    for (let i = 0; i < count; i++) {
        alienShips.push({ x: Math.random() * (canvas.width - 60), y: -50, width: 60, height: 40 });
    }
    gameState.alien.bulletsPerWave++;
}

// Handle collisions
function checkCollisions() {
    // Check collisions between bullets and alien ships
    for (let i = 0; i < shipBullets.length; i++) {
        for (let j = 0; j < alienShips.length; j++) {
            if (isColliding(shipBullets[i], alienShips[j])) {
                alienShips.splice(j, 1);
                shipBullets.splice(i, 1);
                gameState.alien.killCount++;
                break;
            }
        }
    }

    // Check collisions between debris and the player ship
    for (let i = 0; i < debrisArray.length; i++) {
        if (isColliding(debrisArray[i], gameState.ship)) {
            gameState.lives--;
            debrisArray.splice(i, 1);
            if (gameState.lives <= 0) gameState.gameOver = true;
            break;
        }
    }

    // Check collisions between alien bullets and the player ship
    for (let i = 0; i < alienBullets.length; i++) {
        if (isColliding(alienBullets[i], gameState.ship)) {
            gameState.lives--;
            alienBullets.splice(i, 1);
            if (gameState.lives <= 0) gameState.gameOver = true;
            break;
        }
    }
}

// Check for collision between two rectangles
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function createAlienWave() {
    const count = Math.min(gameState.alien.bulletsPerWave + gameState.level, 10);  // Increase difficulty by level
    for (let i = 0; i < count; i++) {
        alienShips.push({ x: Math.random() * (canvas.width - 60), y: -50, width: 60, height: 40 });
    }
    gameState.alien.bulletsPerWave++;
    gameState.alien.speed += 0.5;  // Gradually increase alien speed
}

function aliensShoot() {
    gameState.alienFireCounter += 1000 / 60;  // Assume 60 FPS
    if (gameState.alienFireCounter >= gameState.alienFireRate) {
        const randomAlien = alienShips[Math.floor(Math.random() * alienShips.length)];
        if (randomAlien) {
            const bulletSpeed = gameState.level >= 3 ? gameState.alienBulletSpeed + 2 : gameState.alienBulletSpeed;
            alienBullets.push({ 
                x: randomAlien.x + randomAlien.width / 2 - 2.5, 
                y: randomAlien.y + randomAlien.height, 
                width: 5, 
                height: 15,
                speed: bulletSpeed
            });
        }
        gameState.alienFireCounter = 0;
    }
}


function shootBullet() {
    const ship = gameState.ship;
    if (gameState.level >= 3) {  // Introduce quad bullets at level 3
        shipBullets.push({ x: ship.x + 10, y: ship.y, width: 5, height: 15 });
        shipBullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y, width: 5, height: 15 });
        shipBullets.push({ x: ship.x + ship.width - 15, y: ship.y, width: 5, height: 15 });
    } else if (gameState.powerUpActive) {
        // Dual bullets during power-up
        shipBullets.push({ x: ship.x + 10, y: ship.y, width: 5, height: 15 });
        shipBullets.push({ x: ship.x + ship.width - 15, y: ship.y, width: 5, height: 15 });
    } else {
        // Single bullet
        shipBullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y, width: 5, height: 15 });
    }
}







// Spawn a power-up occasionally
function spawnPowerUp() {
    if (!powerUp && Math.random() < 0.01) {
        powerUp = { x: Math.random() * (canvas.width - 50), y: -50, width: 50, height: 50 };
    }
}

// Check for power-up collision
function checkPowerUpCollision() {
    if (powerUp && isColliding(powerUp, gameState.ship)) {
        powerUp = null;
        gameState.powerUpActive = true;
        setTimeout(() => {
            gameState.powerUpActive = false;
        }, 5000); // Active for 5 seconds
    }
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over!', canvas.width / 2 - 120, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press F5 to restart', canvas.width / 2 - 100, canvas.height / 2 + 50);
}

// Draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 100, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press P to resume', canvas.width / 2 - 120, canvas.height / 2 + 50);
}

// Pause and resume functionality
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
        gameState.paused = !gameState.paused;
    }
});

































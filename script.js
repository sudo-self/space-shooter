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

// Spawn debris randomly
function spawnDebris() {
    if (Math.random() < 0.02) { // Adjust frequency of debris spawn
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
        powerUp.y += 3; // Power-up falls
        if (powerUp.y > canvas.height) {
            powerUp = null; // Remove power-up if it falls off screen
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
        ctx.fillStyle = 'yellow'; // Bullet color
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien bullets
    for (const bullet of alienBullets) {
        ctx.fillStyle = 'red'; // Alien bullet color
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien ships
    for (const alien of alienShips) {
        ctx.drawImage(images.alienShip, alien.x, alien.y, alien.width, alien.height);
    }

    // Draw player ship
    ctx.drawImage(images.ship, gameState.ship.x, gameState.ship.y, gameState.ship.width, gameState.ship.height);

    // Draw power-up if exists
    if (powerUp) {
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }

    // Draw lives
    ctx.fillStyle = 'white';
    ctx.fillText(`Lives: ${gameState.ship.lives}`, 10, 20);
    ctx.fillText(`Level: ${gameState.level}`, canvas.width - 100, 20);
}

// Check for collisions
function checkCollisions() {
    // Check collision between ship bullets and aliens
    for (let i = 0; i < shipBullets.length; i++) {
        for (let j = 0; j < alienShips.length; j++) {
            if (collision(shipBullets[i], alienShips[j])) {
                gameState.alien.killCount++;
                alienShips.splice(j, 1);
                shipBullets.splice(i, 1);
                i--;
                break;
            }
        }
    }

    // Check collision between debris and ship
    for (let i = 0; i < debrisArray.length; i++) {
        if (collision(debrisArray[i], gameState.ship)) {
            gameState.ship.lives--;
            debrisArray.splice(i, 1);
            if (gameState.ship.lives <= 0) {
                gameState.gameOver = true;
            }
            break;
        }
    }

    // Check collision between alien bullets and ship
    for (let i = 0; i < alienBullets.length; i++) {
        if (collision(alienBullets[i], gameState.ship)) {
            gameState.ship.lives--;
            alienBullets.splice(i, 1);
            if (gameState.ship.lives <= 0) {
                gameState.gameOver = true;
            }
            break;
        }
    }
}

// Check for collision between two objects
function collision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Spawn alien wave
function createAlienWave() {
    for (let i = 0; i < gameState.alien.bulletsPerWave; i++) {
        alienShips.push({ x: Math.random() * (canvas.width - 50), y: 0, width: 50, height: 50 });
    }
}

// Handle alien shooting
function aliensShoot() {
    gameState.alienFireCounter += 16.67; // Approximate milliseconds passed (60 FPS)
    if (gameState.alienFireCounter > gameState.alienFireRate) {
        for (const alien of alienShips) {
            alienBullets.push({ x: alien.x + alien.width / 2, y: alien.y + alien.height, width: 5, height: 15 });
        }
        gameState.alienFireCounter = 0;
    }
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 24);
    ctx.fillText('Press R to Restart', canvas.width / 2 - 150, canvas.height / 2 + 24);
}

// Draw pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 70, canvas.height / 2 - 24);
}

// Spawn power-up
function spawnPowerUp() {
    if (!powerUp && Math.random() < 0.001) { // Spawn power-up occasionally
        powerUp = { x: Math.random() * (canvas.width - 40), y: 0, width: 40, height: 40 };
    }
}

// Check collision with power-up
function checkPowerUpCollision() {
    if (powerUp && collision(powerUp, gameState.ship)) {
        gameState.powerUpActive = true;
        setTimeout(() => {
            gameState.powerUpActive = false;
            powerUp = null;
        }, 10000); // Power-up lasts for 10 seconds
        powerUp = null; // Remove power-up once collected
    }
}

// Restart the game
function restartGame() {
    gameState = {
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
    debrisArray = [];
    shipBullets = [];
    alienBullets = [];
    alienShips = [];
    powerUp = null;
    createAlienWave();
    gameLoop();
}

// Handle key presses for restart
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && gameState.gameOver) {
        restartGame();
    }
});

// Start the game
init();








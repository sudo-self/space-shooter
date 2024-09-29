// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    ship: { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50, lives: 3 },
    kills: 0,
    gameOver: false,
    paused: false,
    powerUpActive: false,
    currentBackground: 'normal', // Track current background ('normal' or 'space')
};

// Assets
const images = {
    ship: new Image(),
    alien: new Image(),
    bullet: new Image(),
    alienBullet: new Image(),
    powerUp: new Image(),
    spaceBackground: new Image(),
    normalBackground: new Image(),
    debris: new Image(),
};

images.ship.src = './assets/ship.webp';
images.alien.src = './assets/alien.webp';
images.bullet.src = './assets/bullet.png';
images.alienBullet.src = './assets/alien-bullet.png';
images.powerUp.src = './assets/power-up.png';
images.spaceBackground.src = './assets/space-background.gif';
images.normalBackground.src = './assets/normal-background.jpg';
images.debris.src = './assets/spaceDebris.webp'; // Adjusted for larger debris

// Input
let leftPressed = false;
let rightPressed = false;
let spacePressed = false;

// Game elements
let shipBullets = [];
let alienArray = [];
let alienBullets = [];
let powerUp = null;
let powerUpTimer = null;
let quadBullet = false; // For quad pink bullets
let debrisArray = []; // To manage space debris elements

// Initialize debris for visual effect
for (let i = 0; i < 10; i++) {
    debrisArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: 50,
        height: 50,
    });
}

// Game loop
function gameLoop() {
    if (!gameState.paused) {
        updateGame();
        drawGame();
    }

    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        drawGameOver();
    }
}

// Handle key events
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') leftPressed = true;
    if (e.code === 'ArrowRight') rightPressed = true;
    if (e.code === 'Space') spacePressed = true;
    if (e.code === 'KeyP') togglePause(); // Pause with 'P' key
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') leftPressed = false;
    if (e.code === 'ArrowRight') rightPressed = false;
    if (e.code === 'Space') spacePressed = false;
});

// Toggle pause function
function togglePause() {
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        drawPauseScreen();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// Update game logic
function updateGame() {
    moveShip();
    moveBullets();
    moveAliens();
    spawnPowerUp();
    checkCollisions();
    checkPowerUpCollision();
    moveDebris();
}

// Move the ship
function moveShip() {
    if (leftPressed && gameState.ship.x > 0) {
        gameState.ship.x -= 5;
    }
    if (rightPressed && gameState.ship.x + gameState.ship.width < canvas.width) {
        gameState.ship.x += 5;
    }
    if (spacePressed) {
        shoot();
    }
}

// Shoot bullets
function shoot() {
    if (quadBullet) {
        // Shoot 4 pink bullets
        shipBullets.push({ x: gameState.ship.x, y: gameState.ship.y, width: 10, height: 20, color: 'pink' });
        shipBullets.push({ x: gameState.ship.x + 10, y: gameState.ship.y, width: 10, height: 20, color: 'pink' });
        shipBullets.push({ x: gameState.ship.x + 20, y: gameState.ship.y, width: 10, height: 20, color: 'pink' });
        shipBullets.push({ x: gameState.ship.x + 30, y: gameState.ship.y, width: 10, height: 20, color: 'pink' });
    } else {
        // Shoot normal bullet
        shipBullets.push({ x: gameState.ship.x + gameState.ship.width / 2 - 2, y: gameState.ship.y, width: 4, height: 10, color: 'white' });
    }
}

// Move bullets
function moveBullets() {
    for (const bullet of shipBullets) {
        bullet.y -= 5;
    }
    shipBullets = shipBullets.filter((bullet) => bullet.y > 0);
}

// Move debris (background only)
function moveDebris() {
    for (const debris of debrisArray) {
        debris.y += 1; // Move the debris slowly down
        if (debris.y > canvas.height) debris.y = -50; // Reset position when it goes off screen
    }
}

// Move aliens
function moveAliens() {
    for (const alien of alienArray) {
        alien.y += 1;
        if (Math.random() < 0.005 && !gameState.paused) {
            alienBullets.push({ x: alien.x + alien.width / 2 - 2, y: alien.y + alien.height, width: 4, height: 10 });
        }
    }
    alienArray = alienArray.filter((alien) => alien.y < canvas.height);
}

// Draw everything
function drawGame() {
    // Draw background
    ctx.drawImage(gameState.currentBackground === 'space' ? images.spaceBackground : images.normalBackground, 0, 0, canvas.width, canvas.height);

    // Draw space debris (visual only)
    for (const debris of debrisArray) {
        ctx.drawImage(images.debris, debris.x, debris.y, debris.width, debris.height);
    }

    // Draw ship bullets
    for (const bullet of shipBullets) {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw alien bullets
    for (const bullet of alienBullets) {
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Draw aliens
    for (const alien of alienArray) {
        ctx.drawImage(images.alien, alien.x, alien.y, alien.width, alien.height);
    }

    // Draw power-up
    if (powerUp) {
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }

    // Draw player ship
    ctx.drawImage(images.ship, gameState.ship.x, gameState.ship.y, gameState.ship.width, gameState.ship.height);

    // Draw HUD once
    drawHUD();
}

// Check for collisions
function checkCollisions() {
    // Collision detection logic
}

// Power-up activation
function activatePowerUp() {
    gameState.powerUpActive = true;
    gameState.currentBackground = 'space'; // Switch background to space
    quadBullet = true;

    clearTimeout(powerUpTimer);
    powerUpTimer = setTimeout(() => {
        gameState.powerUpActive = false;
        gameState.currentBackground = 'normal'; // Revert to normal background
        quadBullet = false;
    }, 20000); // Power-up lasts for 20 seconds
}

// Spawn a power-up
function spawnPowerUp() {
    if (!powerUp && Math.random() < 0.001) {
        powerUp = { x: Math.random() * (canvas.width - 40), y: 0, width: 40, height: 40 };
    }
}

// Collision detection helper
function isColliding(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Draw HUD
function drawHUD() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Lives: ' + gameState.ship.lives, 20, 30);
    ctx.fillText('Kills: ' + gameState.kills, 20, 60);
}

// Draw game over screen
function drawGameOver() {
    ctx.font = '50px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
}

// Draw pause screen
function drawPauseScreen() {
    ctx.font = '50px Arial';
    ctx.fillStyle = 'yellow';
    ctx.fillText('PAUSED', canvas.width / 2 - 100, canvas.height / 2);
}

// Start game
requestAnimationFrame(gameLoop);














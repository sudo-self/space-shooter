const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load assets
const assets = {
    spaceDebris: './assets/spaceDebris.webp',
    ship: './assets/ship.webp',
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
let powerUp = null;

let gameState = {
    debrisSpeed: 2,
    bulletSpeed: 7,
    paused: false,
    gameOver: false,
    powerUpActive: false,
    ship: { x: canvas.width / 2 - 30, y: canvas.height - 60, width: 60, height: 60, speed: 7, lives: 4 },
    kills: 0,  // Initialize kills
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
    spawnPowerUp();
    checkPowerUpCollision();
    drawHUD(); // Draw HUD for lives and kills

    requestAnimationFrame(gameLoop);
}

// Start the game
init();

function drawBackground() {
    // Scroll the background
    backgroundY += backgroundSpeed;
    if (backgroundY >= canvas.height) backgroundY = 0;

    ctx.drawImage(images.background, 0, backgroundY, canvas.width, canvas.height);
    ctx.drawImage(images.background, 0, backgroundY - canvas.height, canvas.width, canvas.height);

    // Render debris as part of the background
    for (let i = 0; i < debrisArray.length; i++) {
        const debris = debrisArray[i];
        debris.y += gameState.debrisSpeed; // Move debris down
        if (debris.y > canvas.height) {
            debrisArray.splice(i, 1); // Remove debris off-screen
            i--; // Adjust index
        } else {
            ctx.drawImage(images.spaceDebris, debris.x, debris.y, debris.width, debris.height);
        }
    }
    
    // Spawn new debris randomly as part of the background
    if (Math.random() < 0.01) { // Less frequent debris
        debrisArray.push({ x: Math.random() * canvas.width, y: -30, width: 20, height: 20 }); // Smaller debris
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
    if (Math.random() < 0.01) {
        debrisArray.push({ x: Math.random() * canvas.width, y: 0, width: 20, height: 20 });
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

    // Draw the player ship
    ctx.drawImage(images.ship, gameState.ship.x, gameState.ship.y, gameState.ship.width, gameState.ship.height);

    // Draw power-up
    if (powerUp) {
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }
}

// Handle collisions
function checkCollisions() {
    // Check collisions between bullets and debris
    for (let i = 0; i < shipBullets.length; i++) {
        for (let j = 0; j < debrisArray.length; j++) {
            if (isColliding(shipBullets[i], debrisArray[j])) {
                debrisArray.splice(j, 1);
                shipBullets.splice(i, 1);
                gameState.kills++; // Increase kills count
                break;
            }
        }
    }

    // Check collisions between debris and the player ship
    for (let i = 0; i < debrisArray.length; i++) {
        if (isColliding(debrisArray[i], gameState.ship)) {
            gameState.ship.lives--;
            debrisArray.splice(i, 1);
            if (gameState.ship.lives <= 0) gameState.gameOver = true;
            break;
        }
    }

    // Check collisions with power-up
    if (powerUp && isColliding(powerUp, gameState.ship)) {
        gameState.powerUpActive = true;
        powerUp = null; // Collect power-up
    }
}

// Collision detection function
function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Spawn power-ups
function spawnPowerUp() {
    if (Math.random() < 0.002 && !powerUp) {
        powerUp = { x: Math.random() * (canvas.width - 50), y: -50, width: 50, height: 50 }; // Example power-up size
    }
}

// Check collision with power-up
function checkPowerUpCollision() {
    // You can add logic here if you want to handle power-up effects
}

// Draw heads-up display (HUD)
function drawHUD() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Lives: ${gameState.ship.lives}`, 10, 30);
    ctx.fillText(`Kills: ${gameState.kills}`, canvas.width - 100, 30); // Adjust position for kills
}

// Game Over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText(`Final Kills: ${gameState.kills}`, canvas.width / 2 - 70, canvas.height / 2 + 20);
    ctx.fillText('Press R to Restart', canvas.width / 2 - 90, canvas.height / 2 + 60);
}

// Pause screen
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.fillText('Paused', canvas.width / 2 - 60, canvas.height / 2 - 20);
}

// Restart game on key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        location.reload(); // Reload the game
    }
});











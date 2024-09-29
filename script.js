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
    spaceBackground: './assets/space-background.gif',
    alien: './assets/ship_alien.webp',
    alienExplode: './assets/kill.webp'
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
let alienArray = [];
let shipBullets = [];
let powerUp = null;

let gameState = {
    debrisSpeed: 2,
    bulletSpeed: 7,
    alienSpeed: 2,  // Alien speed
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
    spawnAliens();  // Spawn aliens
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

// Spawn aliens randomly
function spawnAliens() {
    if (Math.random() < 0.01) {
        alienArray.push({ x: Math.random() * canvas.width, y: -60, width: 60, height: 60 });
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

    // Update aliens
    for (let i = 0; i < alienArray.length; i++) {
        alienArray[i].y += gameState.alienSpeed;
        if (alienArray[i].y > canvas.height) {
            alienArray.splice(i, 1);
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

    // Draw aliens
    for (const alien of alienArray) {
        ctx.drawImage(images.alien, alien.x, alien.y, alien.width, alien.height);
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
    // Check collisions between bullets and debris/aliens
    for (let i = 0; i < shipBullets.length; i++) {
        for (let j = 0; j < debrisArray.length; j++) {
            if (isColliding(shipBullets[i], debrisArray[j])) {
                debrisArray.splice(j, 1);
                shipBullets.splice(i, 1);
                gameState.kills++; // Increase kills count
                break;
            }
        }

        for (let k = 0; k < alienArray.length; k++) {
            if (isColliding(shipBullets[i], alienArray[k])) {
                alienArray.splice(k, 1);
                shipBullets.splice(i, 1);
                gameState.kills++; // Increase kills count
                break;
            }
        }
    }

    // Check collisions between aliens/debris and the ship
    for (const debris of debrisArray) {
        if (isColliding(gameState.ship, debris)) {
            takeDamage();
        }
    }

    for (const alien of alienArray) {
        if (isColliding(gameState.ship, alien)) {
            takeDamage();
        }
    }
}

// Take damage (reduce lives)
function takeDamage() {
    gameState.ship.lives--;
    if (gameState.ship.lives <= 0) {
        gameState.gameOver = true;
    }
}

// Collision detection helper function
function isColliding(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Spawn a power-up at random
function spawnPowerUp() {
    if (!powerUp && Math.random() < 0.001) {
        powerUp = { x: Math.random() * (canvas.width - 20), y: 0, width: 20, height: 20 };
    }
}

// Check if the ship collides with the power-up
function checkPowerUpCollision() {
    if (powerUp && isColliding(gameState.ship, powerUp)) {
        gameState.powerUpActive = true;
        powerUp = null;
        setTimeout(() => (gameState.powerUpActive = false), 10000); // Power-up lasts for 10 seconds
    }
}

// Draw the HUD (lives and kills)
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

// Draw the pause screen
function drawPauseScreen() {
    ctx.font = '50px Arial';
    ctx.fillStyle = 'yellow';
    ctx.fillText('PAUSED', canvas.width / 2 - 100, canvas.height / 2);
}











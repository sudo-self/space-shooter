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

images.ship.src = './assets/ship.png';
images.alien.src = './assets/alien.png';
images.bullet.src = './assets/bullet.png';
images.alienBullet.src = './assets/alien-bullet.png';
images.powerUp.src = './assets/power-up.png';
images.spaceBackground.src = './assets/space-background.gif';
images.normalBackground.src = './assets/normal-background.png';
images.debris.src = './assets/debris.png'; 

// Input state
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
    moveDebris(); // Move background debris
    drawHUD();
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
        for (let i = 0; i < 4; i++) {
            shipBullets.push({ 
                x: gameState.ship.x + (i * 10), // Offset bullets horizontally
                y: gameState.ship.y, 
                width: 10, 
                height: 20, 
                color: 'pink' 
            });
        }
    } else {
        // Shoot normal bullet
        shipBullets.push({ 
            x: gameState.ship.x + gameState.ship.width / 2 - 2, 
            y: gameState.ship.y, 
            width: 4, 
            height: 10, 
            color: 'white' 
        });
    }
}

// Move bullets
function moveBullets() {
    shipBullets.forEach(bullet => bullet.y -= 5);
    shipBullets = shipBullets.filter(bullet => bullet.y > 0);
}

// Move debris (background only)
function moveDebris() {
    debrisArray.forEach(debris => {
        debris.y += 2; // Move the debris slowly
        if (debris.y > canvas.height) debris.y = -50; // Loop debris to top
    });
}

// Move aliens
function moveAliens() {
    alienArray.forEach(alien => {
        alien.y += 1;
        if (Math.random() < 0.005 && !gameState.paused) {
            alienBullets.push({ 
                x: alien.x + alien.width / 2 - 2, 
                y: alien.y + alien.height, 
                width: 4, 
                height: 10 
            });
        }
    });
    alienArray = alienArray.filter(alien => alien.y < canvas.height);
}

// Draw everything
function drawGame() {
    ctx.drawImage(gameState.currentBackground === 'space' ? images.spaceBackground : images.normalBackground, 0, 0, canvas.width, canvas.height);

    // Draw space debris (if power-up active)
    if (gameState.powerUpActive) {
        debrisArray.forEach(debris => {
            ctx.drawImage(images.debris, debris.x, debris.y, 40, 40);
        });
    }

    // Draw bullets
    shipBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    alienBullets.forEach(bullet => {
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw aliens
    alienArray.forEach(alien => {
        ctx.drawImage(images.alien, alien.x, alien.y, alien.width, alien.height);
    });

    // Draw power-up
    if (powerUp) {
        ctx.drawImage(images.powerUp, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    }

    // Draw player ship
    ctx.drawImage(images.ship, gameState.ship.x, gameState.ship.y, gameState.ship.width, gameState.ship.height);
}

// Check for collisions
function checkCollisions() {
    // Check bullet collisions with aliens
    for (let i = shipBullets.length - 1; i >= 0; i--) {
        for (let j = alienArray.length - 1; j >= 0; j--) {
            if (isColliding(shipBullets[i], alienArray[j])) {
                shipBullets.splice(i, 1); // Remove bullet
                alienArray.splice(j, 1); // Remove alien
                gameState.kills++;
                break; // Exit inner loop after a hit
            }
        }
    }

    // Check alien bullet collisions with ship
    for (let bullet of alienBullets) {
        if (isColliding(bullet, gameState.ship)) {
            gameState.ship.lives--;
            alienBullets = alienBullets.filter(b => b !== bullet); // Remove bullet
            if (gameState.ship.lives <= 0) {
                gameState.gameOver = true; // Set game over if lives are 0
            }
            break; // Exit after taking damage
        }
    }
}

// Power-up collision check
function checkPowerUpCollision() {
    if (powerUp && isColliding(powerUp, gameState.ship)) {
        activatePowerUp();
        powerUp = null; // Remove power-up after collection
    }
}

// Activate power-up
function activatePowerUp() {
    gameState.powerUpActive = true;
    gameState.currentBackground = 'space'; // Switch background to space
    quadBullet = true; // Enable quad bullets

    clearTimeout(powerUpTimer);
    powerUpTimer = setTimeout(() => {
        gameState.powerUpActive = false;
        gameState.currentBackground = 'normal'; // Revert to normal background
        quadBullet = false; // Disable quad bullets
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
    if (gameState.paused) {
        ctx.fillText('Game Paused', canvas.width / 2 - 50, canvas.height / 2);
    }
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Kills: ' + gameState.kills, canvas.width / 2 - 50, canvas.height / 2 + 20);
}

// Start the game
requestAnimationFrame(gameLoop);













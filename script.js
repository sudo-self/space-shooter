// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ship object
const ship = {
    width: 50,
    height: 50,
    x: canvas.width / 2 - 25,
    y: canvas.height - 90,
    speed: 5,
    bullets: [],
    lives: 3,
    image: new Image()
};
ship.image.src = './assets/ship.webp';

// Alien Ship object
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

// Game variables
let bulletSpeed = 7;
let bulletColor = 'green';
let alienBulletSpeed = 5;
let alienBulletColor = 'red';
let isDragging = false;
let touchStartX = 0;
let touchStartY = 0;
let pause = false;

// Touch event: start dragging the ship
canvas.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Check if the touch is on the ship
    if (
        touchX >= ship.x &&
        touchX <= ship.x + ship.width &&
        touchY >= ship.y &&
        touchY <= ship.y + ship.height
    ) {
        isDragging = true;
        touchStartX = touchX - ship.x;
        touchStartY = touchY - ship.y;
    } else {
        // Tap to shoot if touch is not on the ship
        shootBullet();
    }
});

// Handle dragging the ship
canvas.addEventListener('touchmove', (event) => {
    if (isDragging) {
        const touch = event.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Move the ship based on touch position
        ship.x = touchX - touchStartX;
        ship.y = touchY - touchStartY;

        // Keep the ship within canvas bounds
        if (ship.x < 0) ship.x = 0;
        if (ship.x > canvas.width - ship.width) ship.x = canvas.width - ship.width;
        if (ship.y < 0) ship.y = 0;
        if (ship.y > canvas.height - ship.height) ship.y = canvas.height - ship.height;
    }
});

// Stop dragging the ship
canvas.addEventListener('touchend', () => {
    isDragging = false;
});

// Shoot bullets
function shootBullet() {
    if (!pause) {
        if (alienShip.killCount >= 9) {
            // Two bullets after 9 kills
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

// Draw the ship
function drawShip() {
    if (ship.image.complete) {
        ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
    }
}

// Draw ship bullets
function drawBullets() {
    ctx.fillStyle = bulletColor;
    ship.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 5, 15);
    });
}

// Move ship bullets
function moveBullets() {
    ship.bullets.forEach(bullet => {
        bullet.y -= bulletSpeed;
    });
    ship.bullets = ship.bullets.filter(bullet => bullet.y > 0);
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawShip(); // Draw the ship
    drawBullets(); // Draw bullets
}

// Game loop
function gameLoop() {
    if (!pause) {
        moveBullets(); // Move bullets
        draw(); // Draw everything
    }
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();







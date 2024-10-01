const CELL_SIZE = 20;
const CELL_NUMBER = 20;
const CANVAS_SIZE = CELL_SIZE * CELL_NUMBER;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');

const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GREEN = '#00FF00';
const BLUE = '#0000FF';
const BLACK = '#000000';

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

class Snake {
    constructor() {
        this.body = [new Vector2(5, 10), new Vector2(4, 10), new Vector2(3, 10)];
        this.direction = new Vector2(1, 0);
        this.color = WHITE;
        this.width = 1;
    }

    draw() {
        this.body.forEach((segment, i) => {
            const x = segment.x * CELL_SIZE;
            const y = segment.y * CELL_SIZE;
            const color = this.getGradientColor(i);
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, CELL_SIZE * this.width / 2);
            ctx.fill();

            if (i === 0) {
                this.drawEyes(x, y);
            }
        });
    }

    getGradientColor(index) {
        const fade = Math.max(0, 1 - index * 0.1);
        const r = Math.floor(parseInt(this.color.slice(1, 3), 16) * fade);
        const g = Math.floor(parseInt(this.color.slice(3, 5), 16) * fade);
        const b = Math.floor(parseInt(this.color.slice(5, 7), 16) * fade);
        return `rgb(${r},${g},${b})`;
    }

    drawEyes(x, y) {
        const eyeRadius = CELL_SIZE / 8;
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 4, y + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.arc(x + 3 * CELL_SIZE / 4, y + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    move() {
        if (this.body.length > 0) {
            const newHead = this.body[0].add(this.direction);
            this.body.unshift(newHead);
            this.body.pop();
        }
    }

    grow() {
        this.body.push(this.body[this.body.length - 1]);
    }

    shrink() {
        if (this.body.length > 1) {
            this.body.pop();
        }
    }

    changeColor(newColor) {
        if (this.color === WHITE) {
            this.color = newColor;
        } else {
            const r = Math.floor((parseInt(this.color.slice(1, 3), 16) + parseInt(newColor.slice(1, 3), 16)) / 2);
            const g = Math.floor((parseInt(this.color.slice(3, 5), 16) + parseInt(newColor.slice(3, 5), 16)) / 2);
            const b = Math.floor((parseInt(this.color.slice(5, 7), 16) + parseInt(newColor.slice(5, 7), 16)) / 2);
            this.color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    }

    fatten() {
        this.width = Math.min(this.width + 0.1, 1);
    }

    slim() {
        this.width = Math.max(this.width - 0.1, 0.5);
    }
}

class Food {
    constructor() {
        this.randomize();
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.pos.x * CELL_SIZE + CELL_SIZE / 2, this.pos.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.pos.x * CELL_SIZE + CELL_SIZE * 0.2, this.pos.y * CELL_SIZE + CELL_SIZE * 0.2, CELL_SIZE / 8, 0, 2 * Math.PI);
        ctx.fill();
    }

    randomize() {
        this.pos = new Vector2(Math.floor(Math.random() * CELL_NUMBER), Math.floor(Math.random() * CELL_NUMBER));
        this.color = [RED, GREEN, BLUE][Math.floor(Math.random() * 3)];
    }
}

class Sprite {
    constructor() {
        this.randomize();
    }

    draw() {
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.roundRect(this.pos.x * CELL_SIZE, this.pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE, CELL_SIZE / 4);
        ctx.fill();

        const eyeRadius = CELL_SIZE / 8;
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.pos.x * CELL_SIZE + CELL_SIZE / 4, this.pos.y * CELL_SIZE + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.arc(this.pos.x * CELL_SIZE + 3 * CELL_SIZE / 4, this.pos.y * CELL_SIZE + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    randomize() {
        this.pos = new Vector2(Math.floor(Math.random() * CELL_NUMBER), Math.floor(Math.random() * CELL_NUMBER));
    }

    move() {
        const directions = [new Vector2(1, 0), new Vector2(-1, 0), new Vector2(0, 1), new Vector2(0, -1)];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const newPos = this.pos.add(direction);
        if (newPos.x >= 0 && newPos.x < CELL_NUMBER && newPos.y >= 0 && newPos.y < CELL_NUMBER) {
            this.pos = newPos;
        }
    }
}

class Game {
    constructor() {
        this.reset();
    }

    reset() {
        this.snake = new Snake();
        this.food = new Food();
        this.sprites = [new Sprite()];
        this.score = 0;
        this.startTime = Date.now();
        this.lastSpriteSpawn = Date.now();
        this.gameOver = false;
        this.speed = 150;
        this.lastSpeedIncrease = Date.now();
    }

    update() {
        if (!this.gameOver) {
            this.snake.move();
            this.checkCollision();
            this.checkFail();
            this.moveSprites();
            this.spawnSprites();
            this.updateSpeed();
        }
    }

    drawElements() {
        ctx.fillStyle = '#afdb46';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        this.food.draw();
        this.snake.draw();
        this.sprites.forEach(sprite => sprite.draw());

        this.drawScore();
        this.drawTimer();

        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    checkCollision() {
        if (this.food.pos.equals(this.snake.body[0])) {
            this.snake.grow();
            this.snake.changeColor(this.food.color);
            this.snake.fatten();
            this.food.randomize();
            this.score++;
        }

        this.sprites.forEach(sprite => {
            if (sprite.pos.equals(this.snake.body[0])) {
                this.snake.shrink();
                this.snake.slim();
                if (this.score > 0) {
                    this.score--;
                }
                if (this.snake.body.length === 1) {
                    this.gameOver = true;
                } else if (this.snake.body.length === 2) {
                    this.snake.color = WHITE;
                }
            }
        });
    }

    checkFail() {
        const head = this.snake.body[0];
        if (head.x < 0 || head.x >= CELL_NUMBER || head.y < 0 || head.y >= CELL_NUMBER) {
            this.gameOver = true;
        }

        for (let i = 1; i < this.snake.body.length; i++) {
            if (this.snake.body[i].equals(head)) {
                this.gameOver = true;
                break;
            }
        }
    }

    moveSprites() {
        this.sprites.forEach(sprite => sprite.move());
    }

    spawnSprites() {
        const currentTime = Date.now();
        if (currentTime - this.startTime > 180000 && currentTime - this.lastSpriteSpawn > 60000) {
            this.sprites.push(new Sprite());
            this.lastSpriteSpawn = currentTime;
        }
    }

    updateSpeed() {
        const currentTime = Date.now();
        if (currentTime - this.startTime > 180000 && currentTime - this.lastSpeedIncrease > 30000) {
            this.speed = Math.max(50, this.speed - 10);
            this.lastSpeedIncrease = currentTime;
        }
    }

    drawScore() {
        scoreElement.textContent = `Score: ${this.score}`;
    }

    drawTimer() {
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.font = '48px Arial';
        ctx.fillStyle = RED;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2);

        ctx.font = '24px Arial';
        ctx.fillStyle = WHITE;
        ctx.fillText('Press SPACE to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40);
    }
}

const game = new Game();

function gameLoop() {
    game.update();
    game.drawElements();
    setTimeout(gameLoop, game.speed);
}

document.addEventListener('keydown', (event) => {
    if (!game.gameOver) {
        switch (event.key) {
            case 'ArrowUp':
                if (game.snake.direction.y !== 1) game.snake.direction = new Vector2(0, -1);
                break;
            case 'ArrowDown':
                if (game.snake.direction.y !== -1) game.snake.direction = new Vector2(0, 1);
                break;
            case 'ArrowLeft':
                if (game.snake.direction.x !== 1) game.snake.direction = new Vector2(-1, 0);
                break;
            case 'ArrowRight':
                if (game.snake.direction.x !== -1) game.snake.direction = new Vector2(1, 0);
                break;
        }
    } else if (event.key === ' ') {
        game.reset();
    }
});

gameLoop();
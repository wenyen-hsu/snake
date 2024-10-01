import pygame
import random
import time
import asyncio
from pygame.math import Vector2

# Initialize Pygame
pygame.init()

# Set up the display
CELL_SIZE = 40
CELL_NUMBER = 20
screen = pygame.display.set_mode((CELL_NUMBER * CELL_SIZE, CELL_NUMBER * CELL_SIZE))
pygame.display.set_caption('Color Changing Snake Game')

# Define colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
BLACK = (0, 0, 0)

class Snake:
    def __init__(self):
        self.body = [Vector2(5, 10), Vector2(4, 10), Vector2(3, 10)]
        self.direction = Vector2(1, 0)
        self.color = WHITE
        self.width = 1

    def draw(self):
        for i, segment in enumerate(self.body):
            x = int(segment.x * CELL_SIZE)
            y = int(segment.y * CELL_SIZE)
            rect = pygame.Rect(x, y, CELL_SIZE, CELL_SIZE)
            
            # Create a gradient effect
            color = self.get_gradient_color(i)
            
            # Draw a rounded rectangle for the body
            pygame.draw.rect(screen, color, rect, border_radius=int(CELL_SIZE * self.width / 2))
            
            # Add eyes to the head
            if i == 0:
                self.draw_eyes(x, y)

    def get_gradient_color(self, index):
        fade = max(0, 1 - index * 0.1)  # Gradually fade to black
        r = int(self.color[0] * fade)
        g = int(self.color[1] * fade)
        b = int(self.color[2] * fade)
        return (r, g, b)

    def draw_eyes(self, x, y):
        eye_radius = CELL_SIZE // 8
        left_eye = (x + CELL_SIZE // 4, y + CELL_SIZE // 4)
        right_eye = (x + 3 * CELL_SIZE // 4, y + CELL_SIZE // 4)
        pygame.draw.circle(screen, BLACK, left_eye, eye_radius)
        pygame.draw.circle(screen, BLACK, right_eye, eye_radius)

    def move(self):
        if len(self.body) > 0:
            body_copy = self.body[:-1]
            body_copy.insert(0, body_copy[0] + self.direction)
            self.body = body_copy

    def grow(self):
        self.body.append(self.body[-1])

    def shrink(self):
        if len(self.body) > 1:
            self.body.pop()

    def change_color(self, new_color):
        if self.color == WHITE:
            self.color = new_color
        else:
            r = (self.color[0] + new_color[0]) // 2
            g = (self.color[1] + new_color[1]) // 2
            b = (self.color[2] + new_color[2]) // 2
            self.color = (r, g, b)

    def fatten(self):
        self.width = min(self.width + 0.1, 1)

    def slim(self):
        self.width = max(self.width - 0.1, 0.5)

class Food:
    def __init__(self):
        self.randomize()

    def draw(self):
        rect = pygame.Rect(int(self.pos.x * CELL_SIZE), int(self.pos.y * CELL_SIZE), CELL_SIZE, CELL_SIZE)
        pygame.draw.ellipse(screen, self.color, rect)  # Use ellipse for a more fruit-like appearance
        # Add a shine effect
        shine_pos = (int(self.pos.x * CELL_SIZE + CELL_SIZE * 0.2), int(self.pos.y * CELL_SIZE + CELL_SIZE * 0.2))
        pygame.draw.circle(screen, WHITE, shine_pos, CELL_SIZE // 8)

    def randomize(self):
        self.pos = Vector2(random.randint(0, CELL_NUMBER - 1), random.randint(0, CELL_NUMBER - 1))
        self.color = random.choice([RED, GREEN, BLUE])

class Sprite:
    def __init__(self):
        self.randomize()

    def draw(self):
        rect = pygame.Rect(int(self.pos.x * CELL_SIZE), int(self.pos.y * CELL_SIZE), CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(screen, BLACK, rect, border_radius=CELL_SIZE // 4)
        # Add eyes to make it look more like a sprite
        eye_radius = CELL_SIZE // 8
        left_eye = (int(self.pos.x * CELL_SIZE + CELL_SIZE // 4), int(self.pos.y * CELL_SIZE + CELL_SIZE // 4))
        right_eye = (int(self.pos.x * CELL_SIZE + 3 * CELL_SIZE // 4), int(self.pos.y * CELL_SIZE + CELL_SIZE // 4))
        pygame.draw.circle(screen, WHITE, left_eye, eye_radius)
        pygame.draw.circle(screen, WHITE, right_eye, eye_radius)

    def randomize(self):
        self.pos = Vector2(random.randint(0, CELL_NUMBER - 1), random.randint(0, CELL_NUMBER - 1))

    def move(self):
        direction = random.choice([Vector2(1, 0), Vector2(-1, 0), Vector2(0, 1), Vector2(0, -1)])
        new_pos = self.pos + direction
        if 0 <= new_pos.x < CELL_NUMBER and 0 <= new_pos.y < CELL_NUMBER:
            self.pos = new_pos

class Game:
    def __init__(self):
        self.reset()

    def reset(self):
        self.snake = Snake()
        self.food = Food()
        self.sprites = [Sprite()]
        self.score = 0
        self.start_time = time.time()
        self.last_sprite_spawn = time.time()
        self.game_over = False
        self.speed = 150  # Initial speed (milliseconds between updates)
        self.last_speed_increase = time.time()

    def update(self):
        if not self.game_over:
            self.snake.move()
            self.check_collision()
            self.check_fail()
            self.move_sprites()
            self.spawn_sprites()
            self.update_speed()

    def draw_elements(self):
        self.food.draw()
        self.snake.draw()
        for sprite in self.sprites:
            sprite.draw()
        self.draw_score()
        self.draw_timer()
        if self.game_over:
            self.draw_game_over()

    def check_collision(self):
        if self.food.pos == self.snake.body[0]:
            self.snake.grow()
            self.snake.change_color(self.food.color)
            self.snake.fatten()
            self.food.randomize()
            self.score += 1

        for sprite in self.sprites:
            if sprite.pos == self.snake.body[0]:
                self.snake.shrink()
                self.snake.slim()
                if self.score > 0:
                    self.score -= 1
                if len(self.snake.body) == 1:
                    self.game_over = True
                else:
                    self.snake.color = WHITE if len(self.snake.body) == 2 else self.snake.color

    def check_fail(self):
        if not 0 <= self.snake.body[0].x < CELL_NUMBER or not 0 <= self.snake.body[0].y < CELL_NUMBER:
            self.game_over = True

        for segment in self.snake.body[1:]:
            if segment == self.snake.body[0]:
                self.game_over = True

    def move_sprites(self):
        for sprite in self.sprites:
            sprite.move()

    def spawn_sprites(self):
        current_time = time.time()
        if current_time - self.start_time > 180 and current_time - self.last_sprite_spawn > 60:
            self.sprites.append(Sprite())
            self.last_sprite_spawn = current_time

    def update_speed(self):
        current_time = time.time()
        if current_time - self.start_time > 180 and current_time - self.last_speed_increase > 30:
            self.speed = max(50, self.speed - 10)  # Increase speed, but not faster than 50ms
            self.last_speed_increase = current_time

    def draw_score(self):
        score_surface = pygame.font.Font(None, 36).render(f'Score: {self.score}', True, WHITE)
        score_rect = score_surface.get_rect(topright=(CELL_NUMBER * CELL_SIZE - 10, 10))
        screen.blit(score_surface, score_rect)

    def draw_timer(self):
        elapsed_time = int(time.time() - self.start_time)
        minutes, seconds = divmod(elapsed_time, 60)
        timer_surface = pygame.font.Font(None, 36).render(f'{minutes:02d}:{seconds:02d}', True, WHITE)
        timer_rect = timer_surface.get_rect(topleft=(10, 10))
        screen.blit(timer_surface, timer_rect)

    def draw_game_over(self):
        game_over_surface = pygame.font.Font(None, 72).render('GAME OVER', True, RED)
        game_over_rect = game_over_surface.get_rect(center=(CELL_NUMBER * CELL_SIZE // 2, CELL_NUMBER * CELL_SIZE // 2))
        screen.blit(game_over_surface, game_over_rect)

        restart_surface = pygame.font.Font(None, 36).render('Press SPACE to restart', True, WHITE)
        restart_rect = restart_surface.get_rect(center=(CELL_NUMBER * CELL_SIZE // 2, CELL_NUMBER * CELL_SIZE // 2 + 50))
        screen.blit(restart_surface, restart_rect)

async def main():
    game = Game()
    SCREEN_UPDATE = pygame.USEREVENT

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == SCREEN_UPDATE:
                game.update()
            if event.type == pygame.KEYDOWN:
                if not game.game_over:
                    if event.key == pygame.K_UP and game.snake.direction != Vector2(0, 1):
                        game.snake.direction = Vector2(0, -1)
                    if event.key == pygame.K_DOWN and game.snake.direction != Vector2(0, -1):
                        game.snake.direction = Vector2(0, 1)
                    if event.key == pygame.K_LEFT and game.snake.direction != Vector2(1, 0):
                        game.snake.direction = Vector2(-1, 0)
                    if event.key == pygame.K_RIGHT and game.snake.direction != Vector2(-1, 0):
                        game.snake.direction = Vector2(1, 0)
                else:
                    if event.key == pygame.K_SPACE:
                        game.reset()

        screen.fill((175, 215, 70))
        game.draw_elements()
        pygame.display.update()

        pygame.time.set_timer(SCREEN_UPDATE, game.speed)
        await asyncio.sleep(0)

asyncio.run(main())
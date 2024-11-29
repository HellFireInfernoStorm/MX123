# main.py

import pygame
import config
from src.camera import Camera
from src.display import Display
from src.comm import SerialComm

def main():
    # Initialize camera and display
    camera = Camera()
    display = Display()
    comm = SerialComm()

    # Main application loop
    running = True
    clock = pygame.time.Clock()
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Process a new frame and get output from camera class
        display_image, scaled_grid, grid = camera.update()

        # Draw the frame on the display
        display.draw_frame(display_image, scaled_grid)

        # Send image to esp via serial comms
        comm.send_image(grid)

        clock.tick(config.TARGET_FPS)

    # Clean up resources
    camera.release()
    display.close()


if __name__ == "__main__":
    main()

# main.py

import pygame
import threading
import serial
import os
import config
from src.camera import Camera
from src.display import Display
from src.comm import SerialComm

serialThreadFlag = True

def readSerial(comm: serial.Serial):
    while serialThreadFlag:
        if comm.in_waiting > 0:
            line = comm.readline().decode('utf-8', errors='replace').strip()  # Read and strip extra spaces/newlines
            if line:
                if "=" in line:
                    os.system("cls")
                else:
                    print(line)

def main():
    # Initialize camera and display
    camera = Camera()
    display = Display()
    comm = SerialComm()

    # Serial communication function
    global serialThreadFlag
    serialThread = threading.Thread(target=readSerial, name='serialThread', args=[comm], daemon=True)
    serialThread.start()

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
    serialThreadFlag = False
    serialThread.join()


if __name__ == "__main__":
    main()

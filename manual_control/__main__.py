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

    # Application variables
    varGridInvert = True
    varBGMasking = False
    varScanLineRateMult = 2

    # Main application loop
    running = True
    clock = pygame.time.Clock()
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                print(event.key)
                match event.key:
                    case 105: # I
                        varGridInvert = not varGridInvert
                    case 109: # M
                        varBGMasking = not varBGMasking
                    case 1073741906: # Up arrow
                        varScanLineRateMult += 1
                    case 1073741905: # Down arrow
                        varScanLineRateMult = max(varScanLineRateMult - 1, 1)

        # Process a new frame and get output from camera class
        display_image, scaled_grid, grid = camera.update(varGridInvert, varBGMasking)

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

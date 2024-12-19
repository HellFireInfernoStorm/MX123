# main.py

import pygame
import threading
import serial
import os
import config
import numpy as np
from src.camera import Camera
from src.display import Display
from src.comm import SerialComm
from src.webserver import WebServer

serialThreadFlag = True
inputModes = {0: 'blank', 1: 'camera', 2: 'webserver'}

def readSerial(comm: serial.Serial):
    while serialThreadFlag:
        if comm.in_waiting > 0:
            line = comm.readline().decode('utf-8', errors='replace').strip()  # Read and strip extra spaces/newlines
            if line:
                if "=" in line:
                    os.system("cls")
                else:
                    print(line)

def webserver(ws: WebServer):
    ws.run()

def main():
    # Initialize modules
    camera = Camera()
    display = Display()
    comm = SerialComm()
    ws = WebServer()

    # Begin receiving serial data
    global serialThreadFlag
    serialThread = threading.Thread(target=readSerial, name='serialThread', args=[comm], daemon=True)
    serialThread.start()

    # Start webserver
    webserverThread = threading.Thread(target=webserver, name='webserverThread', args=[ws], daemon=True)
    webserverThread.start()

    # Application variables
    varGridInvert = False
    varBGMasking = False
    varLineDelay = 2
    inputMode = 1

    # Main application loop
    running = True
    clock = pygame.time.Clock()
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                match event.key:
                    case 105: # I
                        varGridInvert = not varGridInvert
                        print(f'invert={varGridInvert}')
                    case 109: # M
                        varBGMasking = not varBGMasking
                        print(f'bgMasking={varBGMasking}')
                    # case 99: # C
                    #     inputMode = 1
                    #     print(f'camera input mode')
                    case 122: # Z
                        inputMode = (inputMode + 1) % 3
                        print(f'inputMode={inputMode} : {inputModes[inputMode]}')
                    case 1073741906: # Up arrow
                        varLineDelay = min(varLineDelay + 1, 255)
                        print(f'lineDelay={50 * varLineDelay}')
                    case 1073741905: # Down arrow
                        varLineDelay = max(varLineDelay - 1, 1)
                        print(f'lineDelay={50 * varLineDelay}')

        if inputMode is 0:
            # Blank mode
            display_image = scaled_grid = np.zeros((config.SCREEN_SIZE, config.HALF_SCREEN_SIZE, 3), np.uint8)
            grid = np.zeros((config.GRID_HEIGHT, config.GRID_WIDTH), bool)
        elif inputMode is 1:
            # Camera mode
            display_image, scaled_grid, grid = camera.update(varGridInvert, varBGMasking)
        elif inputMode is 2:
            # Webserver mode
            display_image, scaled_grid, grid = ws.getDisplay(varGridInvert)

        # Draw the frame on the display
        display.draw_frame(display_image, scaled_grid)
        if grid is not None:
            # Send image to esp via serial comms
            comm.sendFrame(grid, varLineDelay)

        clock.tick(config.TARGET_FPS)

    # Clean up resources
    camera.release()
    display.close()
    serialThreadFlag = False
    serialThread.join()


if __name__ == "__main__":
    main()

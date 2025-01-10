# main.py

import pygame
import threading
import pygame.locals
import serial
import os
import config
import numpy as np
import tkinter as tk
from tkinter.filedialog import askopenfilename
from src.camera import Camera
from src.display import Display
from src.comm import SerialComm
from src.webserver import WebServer

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

def webserver(ws: WebServer):
    ws.run()

def main():
    # Initialize modules
    camera_num = 0
    camera = Camera(camera_num)
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
    varLinesVert = False
    inputMode = 0
    fileName = ''

    shiftUp = False

    # Main application loop
    running = True
    clock = pygame.time.Clock()
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.MOUSEWHEEL:
                varLineDelay = min(max(varLineDelay + event.y * (5 if shiftUp else 1), 1), 255)
                print(f'lineDelay={50 * varLineDelay}')

            elif event.type == pygame.KEYUP:
                match event.key:
                    case pygame.locals.K_LSHIFT: # L SHIFT
                        shiftUp = False
                    case pygame.locals.K_RSHIFT: # R SHIFT
                        shiftUp = False

            elif event.type == pygame.KEYDOWN:
                match event.key:
                    case pygame.locals.K_q: # Q
                        varGridInvert = not varGridInvert
                        print(f'invert={varGridInvert}')
                    case pygame.locals.K_w: # W
                        varBGMasking = not varBGMasking
                        print(f'bgMasking={varBGMasking}')
                    case pygame.locals.K_e: # E
                        varLinesVert = not varLinesVert
                        print(f'scanLineDirection={"vertical" if varLinesVert else "horizontal"}')
                    
                    case pygame.locals.K_z: # Z
                        inputMode = 0
                        camera = Camera(camera_num)
                        print(f'inputMode=Camera')
                    case pygame.locals.K_x: # X
                        inputMode = 1
                        fileName = askopenfilename(initialdir='.', filetypes=[('MP4', '*.mp4')])
                        camera = Camera(fileName)
                        print(f'inputMode=VideoPlayback')
                    case pygame.locals.K_c: # C
                        inputMode = 2
                        print(f'inputMode=Webserver')

                    case pygame.locals.K_LSHIFT: # L SHIFT
                        shiftUp = True
                    case pygame.locals.K_RSHIFT: # R SHIFT
                        shiftUp = True

        if inputMode == 0 or inputMode == 1:
            # Camera mode
            display_image, scaled_grid, grid = camera.update(varGridInvert, varBGMasking)
        elif inputMode == 2:
            # Webserver mode
            display_image, scaled_grid, grid = ws.getDisplay(varGridInvert)

        # Draw the frame on the display
        display.draw_frame(display_image, scaled_grid)
        if grid is not None:
            # Send image to esp via serial comms
            comm.sendFrame(grid, varLineDelay, varLinesVert)

        if inputMode != 2:
            clock.tick(config.TARGET_FPS)

    # Clean up resources
    camera.release()
    display.close()
    serialThreadFlag = False
    serialThread.join()


if __name__ == "__main__":
    main()

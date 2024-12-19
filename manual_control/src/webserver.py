# src/webserver.py

from flask import Flask, render_template
import numpy as np
import cv2
import config

class WebServer:
    def __init__(self, host='0.0.0.0', port=80):
        # Setup webserver
        self.app = Flask(__name__, static_folder='../webserver/static', template_folder='../webserver/templates')
        self.host = host
        self.port = port

        # Setup internal grid
        self.grid = np.zeros((64,32), bool)
        self.grid[20, 20] = True

        # Setup endpoints
        self._setup_()

    # Creates the endpoints
    def _setup_(self):
        # HTML pages
        @self.app.route('/')
        def index():
            return render_template('index.html')
        
        @self.app.route('/display')
        def display():
            return render_template('display.html')
        
        # API endpoints

    # Start the server
    def run(self):
        self.app.run(host=self.host, port=self.port)

    # Create different previews of grid
    def getDisplay(self, invert=False):
        grid = self.grid
        if invert:
            grid = np.logical_not(grid)

        # Create screen sized grid table
        display_img = np.zeros((grid.shape[0], grid.shape[1], 3), np.uint8)
        display_img[grid > 0] = (255, 255, 255)
        display_img = cv2.resize(display_img, (config.HALF_SCREEN_SIZE, config.SCREEN_SIZE), interpolation=cv2.INTER_NEAREST)

        # Scale grid for display
        # Add led gaps
        grid_display = np.zeros((config.GRID_HEIGHT + (config.GRID_HEIGHT - 1) * config.GRID_LED_GAP, config.GRID_WIDTH + (config.GRID_WIDTH - 1) * config.GRID_LED_GAP, 3), np.uint8)
        grid_display[::(config.GRID_LED_GAP + 1), ::(config.GRID_LED_GAP + 1)][grid > 0] = (0, 0, 255)
        # Resize for display
        grid_display = cv2.resize(grid_display, (config.HALF_SCREEN_SIZE, config.SCREEN_SIZE), interpolation=cv2.INTER_NEAREST)

        return display_img, grid_display, grid

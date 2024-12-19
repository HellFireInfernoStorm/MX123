# src/camera.py

import cv2
import numpy as np
import config

class Camera:
    def __init__(self):
        # Initialize the camera
        self.cap = cv2.VideoCapture(0)

        # Initialize background substractor
        self.backsub = cv2.createBackgroundSubtractorKNN(200, 100, False)

        # Crop a 2:1 aspect ration from the center of frame
        # Calculate height and width for cropping
        frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) # Source frame width
        frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) # Source frame height

        if frame_width > (frame_height // 2):
            self.crop_w = frame_height // 2 # Cropped width
            self.crop_h = self.crop_w * 2 # Cropped height
        else:
            self.crop_h = frame_width * 2 # Cropped height
            self.crop_w = self.crop_h // 2 # Cropped width

        # Calculate offsets for cropping
        self.crop_x = (frame_width - self.crop_w) // 2 # Cropping x offset
        self.crop_y = (frame_height - self.crop_h) // 2 # Cropping y offset
        
    def update(self, outputInvert=False, bgMasking=False):
        # Capture frame from the camera
        ret, frame = self.cap.read()
        if not ret:
            print("No frame")
            return None, None, None

        # Crop the frame to a 2:1 aspect ratio
        frame = frame[self.crop_y:self.crop_y+self.crop_h, self.crop_x:self.crop_x+self.crop_w]

        # Store cropped image for display purposes
        # Resize the cropped frame to fit half the screen width
        resized_frame = cv2.resize(frame, (config.HALF_SCREEN_SIZE, config.SCREEN_SIZE))
        # Convert to RGB format for Pygame
        resized_frame_rgb = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)

        # Resize frame to grid dimensions
        grid = cv2.resize(frame, (config.GRID_WIDTH, config.GRID_HEIGHT), interpolation=cv2.INTER_AREA)
        # Convert to b/w
        grid = cv2.cvtColor(grid, cv2.COLOR_BGR2GRAY) # Convert to grayscale first
        grid = cv2.adaptiveThreshold(grid, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

        # Background masking
        if bgMasking:
            # Generate foreground mask
            fg_mask = self.backsub.apply(frame)
            # Apply morphology to denoise and fill holes in mask
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=2)
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_DILATE, kernel, iterations=20)
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_ERODE, kernel, iterations=20)

            # Threshold mask to convert to b/w
            _, fg_mask = cv2.threshold(fg_mask, 1, 255, cv2.THRESH_BINARY)
            # Resize mask to grid dimensions
            fg_mask = cv2.resize(fg_mask, (config.GRID_WIDTH, config.GRID_HEIGHT), interpolation=cv2.INTER_NEAREST)
            
            # Apply mask over resized image
            grid = cv2.bitwise_and(grid, fg_mask)

        # Invert grid
        if outputInvert:
            grid = np.logical_not(grid)

        # Scale grid for display
        # Add led gaps
        grid_display = np.zeros((config.GRID_HEIGHT + (config.GRID_HEIGHT - 1) * config.GRID_LED_GAP, config.GRID_WIDTH + (config.GRID_WIDTH - 1) * config.GRID_LED_GAP, 3), np.uint8)
        grid_display[::(config.GRID_LED_GAP + 1), ::(config.GRID_LED_GAP + 1)][grid > 0] = (0, 0, 255)
        # Resize for display
        grid_display = cv2.resize(grid_display, (config.HALF_SCREEN_SIZE, config.SCREEN_SIZE), interpolation=cv2.INTER_NEAREST)

        return resized_frame_rgb, grid_display, grid
        
    def release(self):
        self.cap.release()

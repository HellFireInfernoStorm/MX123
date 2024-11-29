import serial
import config
import numpy as np

class SerialComm(serial.Serial):
    def __init__(self, port=config.COM_PORT, baudrate=921600, timeout=1):
        try:
            super().__init__(port=port, baudrate=baudrate, timeout=timeout)
        except serial.SerialException:
            print(f"Failed to connect to port {port}. Setting port to None.")
            self.port = None

    def reconnect(self):
        # Attempt to reconnect to the configured port
        if self.port is None and config.COM_PORT:
            try:
                self.port = config.COM_PORT
                self.open()
                print(f"Reconnected to port {config.COM_PORT}.")
            except serial.SerialException as e:
                print(f"Failed to reconnect to port {config.COM_PORT}: {e}")
                self.port = None

    def send_image(self, grid):
        # Ensure there's an image to send
        if grid is not None:
            # Create new array with header
            frame = np.zeros(264, dtype=np.uint8)
            frame[0:8] = 0b01010101

            # Convert grid to bytearray and append to frame
            frame[8:] = np.packbits(grid)

            # Attempt to reconnect if the port is None
            if self.port is None:
                print("Serial port is not open. Attempting to reconnect...")
                self.reconnect()

            # Send the bytearray over serial
            if self.is_open:
                self.write(frame.tobytes())

        else:
            print("No image data to send.")

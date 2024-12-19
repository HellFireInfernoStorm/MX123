// gpio_controller.cpp
#include "gpio_controller.h"

void GpioController::init() {
    // Initialize pins
    pinMode(DATA_PIN, OUTPUT);
    pinMode(CLOCK_PIN_ANODE, OUTPUT);
    pinMode(CLOCK_PIN_CATHODE, OUTPUT);
    pinMode(LATCH_PIN, OUTPUT);
    pinMode(OE_PIN, OUTPUT);

    // Initizalize grid as blank
    disableOutput();
    clearGrid();
    latchData();
}

// Move data from shift registers to output registers
void GpioController::latchData() {
    digitalWrite(LATCH_PIN, LOW);
    // delayMicroseconds(1); // Delay to ensure timing
    digitalWrite(LATCH_PIN, HIGH);
    digitalWrite(LATCH_PIN, LOW);
}

// Enable output to grid
void GpioController::enableOutput() {
    digitalWrite(OE_PIN, LOW);
}

// Disable output to grid
void GpioController::disableOutput() {
    digitalWrite(OE_PIN, HIGH);
}

// Shift in zeroes to clear grid
void GpioController::clearGrid() {
    // Zero row axis
    for (int i = 0; i < ROWS / 8; i++) {
        shiftOut(DATA_PIN, CLOCK_PIN_ANODE, LSBFIRST, 0x00);
    }

    // Zero column axis (inverted)
    for (int i = 0; i < COLS / 8; i++) {
        shiftOut(DATA_PIN, CLOCK_PIN_CATHODE, LSBFIRST, 0xFF);
    }
}

// Shift a single bit
void GpioController::shiftBit(uint8_t dataPin, uint8_t clockPin, uint8_t bit) {
    digitalWrite(dataPin, bit);
    digitalWrite(clockPin, HIGH);
    // delayMicroseconds(1); // Delay to ensure timing
    digitalWrite(clockPin, LOW);
}

// Display image on grid with vertical scanlines
void GpioController::updateVertical(uint8_t *buffer) {
    // Shift initial 1 into row axis
    shiftBit(DATA_PIN, CLOCK_PIN_ANODE, 1);

    // Shift each row in succession
    for (int i = 0; i < ROWS; i++) {
        // Shift column data (last byte first) (inverted)
        for (int j = 0; j < (COLS / 8); j++) {
            shiftOut(DATA_PIN, CLOCK_PIN_CATHODE, MSBFIRST, ~(buffer[i * (COLS / 8) + j]));
        }

        latchData();
        enableOutput();
        delayMicroseconds(50); // Microsecond delay where line is visible
        disableOutput();

        // Shift successive 0s along row axis
        shiftBit(DATA_PIN, CLOCK_PIN_ANODE, 0);
    }
}

// Display image on grid with horizontal scanlines
void GpioController::updateHorizontal(uint8_t *buffer) {
    // Shift initial 1 into column axis (inverted)
    shiftBit(DATA_PIN, CLOCK_PIN_CATHODE, 0);

    // Shift each column in succession
    for (int i = 0; i < COLS; i++) {
        // Shift row data (last byte first)
        for (int j = ROWS; j >= 0; j--) {
            shiftBit(DATA_PIN, CLOCK_PIN_ANODE, (buffer[i / 8 + j * COLS] >> (i % 8)) & 0x1);
        }

        latchData();
        enableOutput();
        delayMicroseconds(50); // Microsecond delay where line is visible
        disableOutput();

        // Shift successive 0s along column axis (inverted)
        shiftBit(DATA_PIN, CLOCK_PIN_CATHODE, 1);
    }
}

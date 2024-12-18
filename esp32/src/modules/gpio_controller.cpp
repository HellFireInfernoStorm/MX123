// gpio_controller.cpp
#include "gpio_controller.h"

void GpioController::init() {
    pinMode(DATA_PIN, OUTPUT);
    pinMode(CLOCK_PIN_ANODE, OUTPUT);
    pinMode(CLOCK_PIN_CATHODE, OUTPUT);
    pinMode(LATCH_PIN, OUTPUT);
    pinMode(OE_PIN, OUTPUT);

    digitalWrite(OE_PIN, HIGH);
    digitalWrite(LATCH_PIN, LOW);
}

void shiftOutBit(uint8_t dataPin, uint8_t clockPin, uint8_t bit) {
    digitalWrite(dataPin, bit);
    digitalWrite(clockPin, HIGH);
    digitalWrite(clockPin, LOW);
}

void GpioController::update(uint8_t *buffer) {
    // Clear y axis
    for (int i = 0; i < ROWS / 8; i++) {
        shiftOut(DATA_PIN, CLOCK_PIN_CATHODE, LSBFIRST, 0x00);
    }
    // Shift initial 1 into y axis
    shiftOutBit(DATA_PIN, CLOCK_PIN_ANODE, 1);
    digitalWrite(LATCH_PIN, LOW);

    // Shift rows
    for (int i = 0; i < ROWS; i++) {
        // Shift out x axis
        for (int j = 0; j < (COLS / 8); j++) {
            shiftOut(DATA_PIN, CLOCK_PIN_ANODE, LSBFIRST, buffer[i*4+j]);
        }

        // Move data from shift register to output registers
        digitalWrite(LATCH_PIN, LOW);
        digitalWrite(LATCH_PIN, HIGH);
        // Enable output
        digitalWrite(OE_PIN, LOW);

        // esp_task_wdt_reset(); // Reset the watchdog timer to prevent task restart

        // Microsecond delay for output
        delayMicroseconds(100);
        // Disable output
        digitalWrite(OE_PIN, HIGH);

        // Shift 0 into y axis
        shiftOutBit(DATA_PIN, CLOCK_PIN_ANODE, 0);
    }
}

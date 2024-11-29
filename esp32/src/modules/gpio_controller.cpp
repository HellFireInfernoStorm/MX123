// gpio_controller.cpp
#include "gpio_controller.h"

void GpioController::init()
{
    pinMode(DATA_PIN, OUTPUT);
    pinMode(CLOCK_PIN_ANODE, OUTPUT);
    pinMode(CLOCK_PIN_CATHODE, OUTPUT);
    pinMode(LATCH_PIN, OUTPUT);
    pinMode(OE_PIN, OUTPUT);
}

void __SOB(uint8_t dataPin, uint8_t clockPin, uint8_t val)
{
    digitalWrite(dataPin, val);
    digitalWrite(clockPin, HIGH);
    digitalWrite(clockPin, LOW);
}

void GpioController::update(uint8_t *buff1, uint8_t *buff2, bool *buff1_flg, bool *buff2_flg)
{
    // uint32_t cathode_pattern;

    // //  Apply bit shifting or any required operation to GPIO pins based on data_array
    // __SOB(DATA_PIN, CLOCK_PIN_ANODE, 1); // initial bit
    // digitalWrite(LATCH_PIN, LOW);
    // for (uint8_t i = 0; i < 64; i++)
    // {
    //     cathode_pattern = (DataDecoder::data_array[i]);
    //     // printBits32(cathode_pattern);

    //     digitalWrite(OE_PIN, HIGH);

    //     for (uint8_t j = 0; j < 4; j++)
    //     {
    //         shiftOut(DATA_PIN, CLOCK_PIN_CATHODE, LSBFIRST, (cathode_pattern >> (j * 8)));
    //     }

    //     digitalWrite(LATCH_PIN, HIGH);
    //     digitalWrite(LATCH_PIN, LOW);

    //     digitalWrite(OE_PIN, LOW);

    //     __SOB(DATA_PIN, CLOCK_PIN_ANODE, 0); // shifting down the rows

    //     esp_task_wdt_reset(); // Reset the watchdog timer to prevent task restart

    //     // Microsecond delay
    //     delayMicroseconds(400);
    // }

    // Choose which buffer to use
    uint8_t *buffer = NULL;
    boolean *buffer_flg;

    if (!(*buff1_flg)) {
        *buff1_flg = true;
        buffer_flg = buff1_flg;
        buffer = buff1;
    } else {
        *buff2_flg = true;
        buffer_flg = buff2_flg;
        buffer = buff2;
    }

    // Shift buffer to grid
    __SOB(DATA_PIN, CLOCK_PIN_ANODE, 1); // shift initial 1 bit
    digitalWrite(LATCH_PIN, LOW);

    // Shift all rows
    for (int i = 0; i < 64; i++) {
        digitalWrite(OE_PIN, HIGH);
        // Shift out row bits
        for (int j = 0; j < 4; j++) {
            shiftOut(DATA_PIN, CLOCK_PIN_CATHODE, LSBFIRST, buffer[i*4+j]);
        }

        digitalWrite(LATCH_PIN, HIGH);
        digitalWrite(LATCH_PIN, LOW);

        digitalWrite(OE_PIN, LOW);

        esp_task_wdt_reset(); // Reset the watchdog timer to prevent task restart

        // Microsecond delay
        delayMicroseconds(400);

        __SOB(DATA_PIN, CLOCK_PIN_ANODE, 0); // shifting 1 bit down y axis
    }

    *buffer_flg = false;
}

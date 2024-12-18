// gpio_controller.h
#ifndef GPIO_CONTROLLER_H
#define GPIO_CONTROLLER_H

#include <Arduino.h>
// #include <algorithm>

// #include "esp_rom_sys.h"
// #include "esp_task_wdt.h"

#include "config.h"

class GpioController {
public:
    static void init();
    static void update(uint8_t *buffer);
};

#endif // GPIO_CONTROLLER_H

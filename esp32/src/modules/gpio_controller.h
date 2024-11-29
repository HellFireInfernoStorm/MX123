// gpio_controller.h
#ifndef GPIO_CONTROLLER_H
#define GPIO_CONTROLLER_H

#include <Arduino.h>
#include <algorithm>
#include <cstdint>

#include "esp_rom_sys.h"
#include "esp_task_wdt.h"

#include "config.h"
#include "data_decoder.h"

class GpioController {
public:
    static void init();
    static void update(uint8_t *buff1, uint8_t *buff2, bool *buff1_flg, bool *buff2_flg);
};

#endif // GPIO_CONTROLLER_H

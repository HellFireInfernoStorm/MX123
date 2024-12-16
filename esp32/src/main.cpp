#include <Arduino.h>

#include "config.h"
// #include "modules/data_decoder.h"
// #include "modules/gpio_controller.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

// #include "esp_task_wdt.h"
// #include "driver/uart.h"

// Double buffering
uint8_t buffer1[256];
uint8_t buffer2[256];

// Mutexes for buffers
SemaphoreHandle_t mutex1;
SemaphoreHandle_t mutex2;

void gpioUpdate(void *pvParameters) {
    while (true) {
        // Pick buffer and take mutex
        uint8_t *buffer = NULL;
        SemaphoreHandle_t mutex = NULL;
        if (xSemaphoreTake(mutex1, 0) == pdTRUE) {
            buffer = buffer1;
            mutex = mutex1;
            Serial.println("Buffer1 Read");
        } else if (xSemaphoreTake(mutex2, 0) == pdTRUE) {
            buffer = buffer2;
            mutex = mutex2;
            Serial.println("Buffer2 Read");
        }

        // Print buffer
        for (int i = 0; i < 64; i++) {
            for (int j = 0; j < 4; j++) {
                for (int k = 7; k >= 0; k--) {
                    if ((buffer[i * 4 + j] >> k) & 0x1) {
                        Serial.print("#");
                    } else {
                        Serial.print(".");
                    }
                    // Serial.printf("%hhu", (buffer[i * 8 + j] >> k) & 0x1);
                }
            }
            Serial.println();
        }
        Serial.println();
        Serial.println("------------------------------------------------------------------------");

        // Release mutex
        if (mutex != NULL) {
            xSemaphoreGive(mutex);
        }

        delay(100);
    }
}

void decode(void *pvParameters) {
    while (true) {
        // Check that data is available
        if (Serial.available() >= 264) {
            // Pick buffer and take mutex
            uint8_t *buffer = NULL;
            SemaphoreHandle_t mutex = NULL;
            if (xSemaphoreTake(mutex1, 0) == pdTRUE) {
                buffer = buffer1;
                mutex = mutex1;
                // Serial.println("Reading to buffer1");
            } else if (xSemaphoreTake(mutex2, 0) == pdTRUE) {
                buffer = buffer2;
                mutex = mutex2;
                // Serial.println("Reading to buffer2");
            }

            if (buffer != NULL) {
                // Decode data into buffer

                // // Skip to last frame
                // int framesToSkip = (Serial.available() / 264) - 1;
                // Serial.readBytes((uint8_t*) NULL, 264 * framesToSkip);

                int count = 0;
                while (Serial.available() > 8) {
                    if (Serial.read() == 85) {
                        count++;
                        if (count == 8) {
                            // Read data into buffer
                            Serial.readBytes(buffer, 265);
                            break;
                        }
                    } else {
                        count = 0;
                    }
                }

                // Flush buffer
                Serial.readBytes((uint8_t*) NULL, Serial.available());
            }

            // Release mutex
            if (mutex != NULL) {
                xSemaphoreGive(mutex);
            }
        }
    }
}

void setup() {
    // Start serial communication
    Serial.setRxBufferSize(264 * 10); // Space for 10 frames
    Serial.begin(921600);
    delay(100);

    // Create mutexes
    mutex1 = xSemaphoreCreateBinary();
    mutex2 = xSemaphoreCreateBinary();

    if (mutex1 == NULL || mutex2 == NULL) {
        Serial.println("Mutex creation failed");
        while (true) {} // Halt execution
    }

    // Give mutexes to initialize
    xSemaphoreGive(mutex1);
    xSemaphoreGive(mutex2);

    // Reset buffers to zero
    memset(buffer1, 0, 256);
    memset(buffer2, 0, 256);

    // Create tasks for decode and display
    xTaskCreatePinnedToCore(decode, "decode", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(gpioUpdate, "gpioUpdate", 4096, NULL, 1, NULL, 1);
}

void loop() {
    // Main loop empty as each task runs in separate thread
}

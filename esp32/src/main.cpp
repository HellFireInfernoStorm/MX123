#include <Arduino.h>

#include "config.h"
// #include "modules/data_decoder.h"
#include "modules/gpio_controller.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

// #include "esp_task_wdt.h"
// #include "driver/uart.h"

// Triple buffering
uint8_t buffer1[256];
uint8_t buffer2[256];
uint8_t buffer3[256];
uint8_t *frontBuffer = buffer1;
uint8_t *backBuffer = buffer2;
uint8_t *freeBuffer = buffer3;

// Mutex for buffer swapping
SemaphoreHandle_t mutex;

void gpioUpdate(void *pvParameters) {
    while (true) {
        // Lock mutex
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {   
            // Swap front and back buffers
            uint8_t *temp = frontBuffer;
            frontBuffer = backBuffer;
            backBuffer = temp;

            // Release mutex
            xSemaphoreGive(mutex);
        }

        // Display frame
        GpioController::update(frontBuffer);

        // // Print buffer
        // for (int i = 0; i < 64; i++) {
        //     for (int j = 0; j < 4; j++) {
        //         for (int k = 7; k >= 0; k--) {
        //             if ((frontBuffer[i * 4 + j] >> k) & 0x1) {
        //                 Serial.print("#");
        //             } else {
        //                 Serial.print(".");
        //             }
        //         }
        //     }
        //     Serial.println();
        // }
        // Serial.println();
        // Serial.println("------------------------------------------------------------------------");

        // delay(250);

    }
}

void decode(void *pvParameters) {
    while (true) {
        // Check that data is available
        if (Serial.available() >= 264) {
            // Decode data into buffer

            // Skip to last frame
            int framesToSkip = (Serial.available() / 264) - 1;
            Serial.readBytes((uint8_t*) NULL, 264 * framesToSkip);

            // Find header
            int count = 0;
            while (Serial.available() > 8) {
                if (Serial.read() == 85) {
                    count++;
                    if (count == 8) {
                        // Read data into buffer
                        Serial.readBytes(freeBuffer, 256);
                        break;
                    }
                } else {
                    count = 0;
                }
            }

            // Flush UART RX buffer
            Serial.readBytes((uint8_t*) NULL, Serial.available());

            // Lock mutex
            if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
                // Swap free and back buffers
                uint8_t *temp = freeBuffer;
                freeBuffer = backBuffer;
                backBuffer = temp;

                // Release mutex
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
    mutex = xSemaphoreCreateBinary();

    if (mutex == NULL) {
        Serial.println("Mutex creation failed");
        while (true) {} // Halt execution
    }

    // Give mutexes to initialize
    xSemaphoreGive(mutex);

    // Reset buffers to zero
    memset(buffer1, 0, 256);
    memset(buffer2, 0, 256);
    memset(buffer3, 0, 256);

    // Initialize gpio
    GpioController::init();

    // Create tasks for decode and display
    xTaskCreatePinnedToCore(decode, "decode", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(gpioUpdate, "gpioUpdate", 4096, NULL, 1, NULL, 1);
}

void loop() {
    // Main loop empty as each task runs in separate thread
}

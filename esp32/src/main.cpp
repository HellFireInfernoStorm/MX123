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
uint8_t buffer1[FRAME_SIZE] = {0};
uint8_t buffer2[FRAME_SIZE] = {0};
uint8_t buffer3[FRAME_SIZE] = {0};
uint8_t *frontBuffer = buffer1;
uint8_t *backBuffer = buffer2;
uint8_t *freeBuffer = buffer3;
volatile bool newFrame = false;

// Mutex for buffer swapping
SemaphoreHandle_t mutex;

void gpioUpdate(void *pvParameters) {
    while (true) {
        // Lock mutex
        if (xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {   
            // Swap front and back buffers
            if (newFrame) {
                uint8_t *temp = frontBuffer;
                frontBuffer = backBuffer;
                backBuffer = temp;
                newFrame = false;
            }

            // Release mutex
            xSemaphoreGive(mutex);
        }

        // Display frame
        GpioController::updateVertical(frontBuffer);

        // // Print buffer
        // for (int i = 0; i < ROWS; i++) {
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
        if (Serial.available() >= PACKET_SIZE) {
            // Decode data into buffer

            // Skip to last frame
            int framesToSkip = (Serial.available() / PACKET_SIZE) - 1;
            Serial.readBytes((uint8_t*) NULL, PACKET_SIZE * framesToSkip);

            // Find header
            int count = 0;
            bool frameRead = false;
            while (Serial.available() > HEADER_SIZE) {
                if (Serial.read() == HEADER_CHAR) {
                    count++;
                    if (count == HEADER_SIZE) {
                        // Read data into buffer
                        Serial.readBytes(freeBuffer, FRAME_SIZE);
                        frameRead = true;
                        break;
                    }
                } else {
                    count = 0;
                }
            }

            // Flush UART RX buffer
            Serial.readBytes((uint8_t*) NULL, Serial.available());

            // Lock mutex
            if (frameRead && xSemaphoreTake(mutex, portMAX_DELAY) == pdTRUE) {
                // Swap free and back buffers
                uint8_t *temp = freeBuffer;
                freeBuffer = backBuffer;
                backBuffer = temp;
                newFrame = true;

                // Release mutex
                xSemaphoreGive(mutex);
            }
        }
    }
}

void setup() {
    // Start serial communication
    Serial.setRxBufferSize(PACKET_SIZE * BUFFER_PACKETS); // Increase RX buffer to fit multiple packets
    Serial.begin(COMMS_BAUD_RATE);
    delay(100);

    // Create mutexes
    mutex = xSemaphoreCreateBinary();

    if (mutex == NULL) {
        Serial.println("Mutex creation failed");
        while (true) {} // Halt execution
    }

    // Initialize mutex
    xSemaphoreGive(mutex);

    // Initialize gpio
    GpioController::init();

    // Create tasks for decode and display
    xTaskCreatePinnedToCore(decode, "decode", 4096, NULL, 1, NULL, 0);
    xTaskCreatePinnedToCore(gpioUpdate, "gpioUpdate", 4096, NULL, 1, NULL, 1);
}

void loop() {
    // Main loop empty as each task runs in separate thread
}

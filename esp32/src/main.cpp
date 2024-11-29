#include "config.h"
#include "modules/data_decoder.h"
#include "modules/gpio_controller.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_task_wdt.h"
#include "driver/uart.h"

// Task Handle
TaskHandle_t gpioTaskHandle = NULL;
TaskHandle_t dataTaskHandle = NULL;

// void printBits32(uint32_t value)
// {
//     for (int i = 31; i >= 0; i--)
//     {
//         // Extract the bit by shifting and masking
//         uint32_t bit = (value >> i) & 1;
//         Serial.print(bit ? "█": " ");

//         // Print a space every 8 bits for better readability
//         /* if (i % 8 == 0)
//         {
//             Serial.print(" ");
//         } */
//     }
//     Serial.println(); // New line after printing all bits
// }

// // GPIO Update Task Function
// void gpioUpdateTask(void *pvParameters)
// {
//     // This function will run in its own thread
//     esp_task_wdt_init(10, false); // 30 seconds timeout

//     esp_task_wdt_add(NULL);

//     while (true)
//     {
//         GpioController::update(); // Call the GPIO update in its own thread */
//         Serial.println("================================");
//         for (size_t i = 0; i < 64; i++)
//         {
//             Serial.printf("%02u: ",i);
//             printBits32(DataDecoder::data_array[i]);
//             taskYIELD();
//             esp_task_wdt_reset();
//         }

//         esp_task_wdt_reset();
//     }
// }

// void dataUpdateTask(void *pvParameters)
// {
//     // This function will run in its own thread
//     esp_task_wdt_init(10, false); // 30 seconds timeout

//     esp_task_wdt_add(NULL);

//     while (true)
//     {
//         if (Serial.available())
//         {
//             DataDecoder::update(Serial.read());
//         }

//         esp_task_wdt_reset();
//     }
// }

// void setup()
// {
//     // Start serial communication
//     Serial.begin(921600);

//     delay(100);

//     // Initialize modules
//     DataDecoder::init();
//     GpioController::init();

//     // Create the GPIO update task (this runs in its own thread)
//     xTaskCreatePinnedToCore(
//         gpioUpdateTask,     // Function to implement the task
//         "GPIO Update Task", // Name of the task
//         2048,               // Stack size
//         NULL,               // Parameters
//         1,                  // Priority
//         &gpioTaskHandle,    // Task handle
//         1                   // Pin to Core 1
//     );

//     // Create the data dec update task (this runs in its own thread)
//     xTaskCreatePinnedToCore(
//         dataUpdateTask,     // Function to implement the task
//         "DATA Update Task", // Name of the task
//         4096,               // Stack size
//         NULL,               // Parameters
//         1,                  // Priority
//         &dataTaskHandle,    // Task handle
//         1                   // Pin to Core 1
//     );
// }

typedef struct buffer_data {
    uint8_t *buff1, *buff2;
    boolean buff1_flg, buff2_flg;
} buffer_data;

void gpioUpdate(void *pvParameters) {
    buffer_data *buffers = (buffer_data*) pvParameters;
    while (true) {
        GpioController::update(
            buffers->buff1,
            buffers->buff2,
            &(buffers->buff1_flg),
            &(buffers->buff2_flg)
        );
    }
}

void decode(void *pvParameters) {
    buffer_data *buffers = (buffer_data*) pvParameters;
    while (true) {

    }
}

void setup() {
    // Start serial communication
    Serial.begin(921600);
    Serial.setRxBufferSize(2640); // Space for 10 frames

    delay(100);

    // Setup frame buffers
    uint8_t buff1[256] = {0};
    uint8_t buff2[256] = {0};
    buffer_data buffers = {buff1, buff2, false, false};

    // Create thread to draw to grid
    xTaskCreatePinnedToCore(
        gpioUpdate,
        "Draw to grid",
        4096,
        &buffers,
        1,
        &gpioTaskHandle,
        0
    );

    // Create thread to read serial data
    xTaskCreatePinnedToCore(
        decode,
        "Decode",
        4096,
        &buffers,
        1,
        &dataTaskHandle,
        1
    );
}

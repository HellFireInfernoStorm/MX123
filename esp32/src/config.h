#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi credentials for station mode
#define WIFI_SSID "YourSSID"
#define WIFI_PASSWORD "YourPassword"

// IP settings
#define AP_SSID "ESP32_AP"
#define AP_PASSWORD "12345678"

// GPIO pin definitions
#define DATA_PIN 13
#define CLOCK_PIN 4
#define LATCH_PIN_ANODE 12
#define LATCH_PIN_CATHODE 14
#define OE_PIN 2

// Array size
#define ARRAY_SIZE 64

#endif // CONFIG_H

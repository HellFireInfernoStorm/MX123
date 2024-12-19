#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi credentials for station mode
#ifndef WIFI_SSID
#define WIFI_SSID "YourSSID"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YourPassword"
#endif

// IP settings
#define AP_SSID "ESP32_AP"
#define AP_PASSWORD "12345678"

// GPIO pin definitions
#define DATA_PIN 13
#define CLOCK_PIN_ANODE 27
#define CLOCK_PIN_CATHODE 4
#define LATCH_PIN 14
#define OE_PIN 2

// Serial communication settings
#define ROWS 64
#define COLS 32
#define FRAME_SIZE (ROWS * COLS / 8)
#define HEADER_SIZE 8
#define HEADER_CHAR 85
#define METADATA_SIZE 1
#define PACKET_SIZE (HEADER_SIZE + FRAME_SIZE + METADATA_SIZE)

#define BUFFER_PACKETS 10
#define COMMS_BAUD_RATE 921600

#endif // CONFIG_H

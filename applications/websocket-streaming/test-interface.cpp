#include "application.h"
#include "test-interface.h"

void reply(char* msg)
{
    Serial.write(REPLY);
    Serial.println(msg);
}

void info(char* msg)
{
    Serial.write(INFO);
    Serial.println(msg);
}

void testTick()
{
    if (Serial.available() > 0) {
        char c = Serial.read();

        switch(c) {
            case CMD_IDENTIFY:
            {
                reply("spark");
                break;
            }

            case CMD_GET_IP:
            {
                IPAddress ip = WiFi.localIP();

                char ipString[24];
                sprintf(ipString, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);

                reply(ipString);

                break;
            }

            case CMD_DFU:
            {
                reply("ok");
                System.bootloader();
                break;
            }
        }
    }
}


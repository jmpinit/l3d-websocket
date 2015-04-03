#include "application.h"
#include "test-interface.h"

// a value in memory for the host to use to communicate with us
volatile long comm = 0;
static volatile long* testCommAddress = &comm;

void reply(const char* msg)
{
    printf("%c%s\r\n", REPLY, msg);
}

void info(const char* msg)
{
    printf("%c%lu %s\r\n", INFO, micros(), msg);
}

volatile long* getCommAddress() {
    return testCommAddress;
}

void testTick()
{
    if (comm != 0) {
        switch (comm) {
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

            case 'f':
                reply("ok");
                while(true) {
                    memcpy((void*)random(0xFFFFFFFF), (void*)random(0xFFFFFFFF), 256);
                }
                break;
        }

        comm = 0;
    }
}


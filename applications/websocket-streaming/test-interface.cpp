#include "application.h"
#include "test-interface.h"

volatile uint32_t* DCRDR = (uint32_t*)DCRDR_ADDR;

void asciimsg(const char* msg);

int countDigits(unsigned long num)
{
    int n = 0;
    while(num) {
        num /= 10;
        n++;
    }
    return n;
}

void reply(const char* msg)
{
    int len = 1 + // REPLY marker
        strlen(msg) +
        3; // \r\n\0

    char* fullmsg = (char*)calloc(1, len);
    sprintf(fullmsg, "%c%s\r\n", REPLY, msg);

    asciimsg(fullmsg);

    free(fullmsg);
}

void info(const char* msg)
{
    unsigned long time = micros();

    int len = 1 + // INFO marker
        countDigits(time) +
        1 + // space
        strlen(msg) +
        3; // \r\n\0

    char* fullmsg = (char*)calloc(1, len);
    sprintf(fullmsg, "%c%lu %s\r\n", INFO, time, msg);

    asciimsg(fullmsg);

    free(fullmsg);
}

void testTick()
{
    if (*DCRDR & 0xFF000000) {
        uint8_t command = *DCRDR >> 24;

        switch (command) {
            case CMD_IDENTIFY:
            {
                reply("spark");
                break;
            }

            case CMD_GET_IP:
            {
                IPAddress ip = WiFi.localIP();

                char* ipMsg = (char*)calloc(1, 24);
                sprintf(ipMsg, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
                reply(ipMsg);
                free(ipMsg);

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

        *DCRDR = 0;
    }
}

void charmsg(char c)
{
    uint32_t request[4] = { TARGET_REQ_DEBUGCHAR, 0, (uint32_t)(c << 8), 0 };

    for (int i = 0; i < 4; i++) {
        *DCRDR = request[i] | REQ_DEBUG;

        // wait for ack
        while ((*DCRDR) & 0x01) {
            __asm__("NOP");
        }
    }
}

void asciimsg(const char* msg)
{
    uint16_t len = strlen(msg);

    uint32_t request[4] = {
        TARGET_REQ_DEBUGMSG,
        ASCIIMSG,
        (uint32_t)((len << 8) & 0xFF00),
        (uint32_t)(len & 0xFF00)
    };

    for (int i = 0; i < 4; i++) {
        *DCRDR = request[i] | REQ_DEBUG;

        // wait for ack
        while ((*DCRDR) & 0x01) {
            __asm__("NOP");
        }
    }

    for (int i = 0; i < len; i++) {
        *DCRDR = (msg[i] << 8) | REQ_DEBUG;

        // wait for ack
        while ((*DCRDR) & 0x01) {
            __asm__("NOP");
        }
    }
}

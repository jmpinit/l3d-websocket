#include <sstream>
#include <math.h>

#include "SparkWebSocketServer.h"

#include "l3d-cube.h"
#include "test-interface.h"

TCPServer server = TCPServer(2525);
SparkWebSocketServer mine(server);
void handle(String &cmd, String &result);

Cube cube = Cube();

void setup()
{
    Serial.begin(115200);

    server.begin();

    CallBack cb = &handle;
    mine.setCallBack(cb);

    cube.begin();
    cube.background(black);

    Serial.println("Setup done");
}

void displayFrame(String* frame, int offset)
{
    for(unsigned int x = 0; x < 8; x++) {
        for(unsigned int y = 0; y < 8; y++) {
            for(unsigned int z = 0; z < 8; z++) {
                int index = z*64 + y*8 + x + offset;

                //colors with max brightness set to 64
                uint8_t red = ((*frame)[index]&0x60)>>1;
                uint8_t green = ((*frame)[index]&0x1C)<<1;
                uint8_t blue = ((*frame)[index]&0x03)<<4;
                Color pixelColor = Color(red, green, blue);
                cube.setVoxel(x, y, z, pixelColor);
            }
        }
    }

    cube.show();
}

/**
 * Handle client requests and reply.
 * @param data string from client
 * @param result string to client
 */
void handle(String &data, String &result)
{
    if(data.length() == 512) {
        displayFrame(&data, 0);
        displayFrame(&data, 0);
    }

    result += String(data.length());
}

void loop()
{
    testTick();
    mine.doIt();
}

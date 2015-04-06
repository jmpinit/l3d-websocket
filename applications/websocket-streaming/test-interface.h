#ifndef _H_TEST_INTERFACE
#define _H_TEST_INTERFACE

#define DCRDR_ADDR 0xE000EDF8

#define ASCIIMSG    0x00
#define HEXMSG      0xFF

#define REQ_DEBUG 1
#define TARGET_REQ_DEBUGCHAR    0x0200
#define TARGET_REQ_DEBUGMSG     0x0100
#define REQ_DEBUGCHAR (TARGET_REQ_DEBUGCHAR | REQ_DEBUG)

#define REPLY   '`'
#define INFO    '~'

#define CMD_IDENTIFY    '?'
#define CMD_GET_IP      'a'
#define CMD_DFU         'b'

void reply(const char*);
void info(const char*);
void writeToDebug(const char* msg);
void testTick(void);

#endif

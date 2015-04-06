target remote localhost:3333
file build/applications/websocket-streaming/websocket-streaming.elf
monitor reset halt
load
monitor reset init

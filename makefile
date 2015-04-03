SRC_DIR = applications/websocket-streaming
SOURCES = $(SRC_DIR)/*.cpp $(SRC_DIR)/*.h
FIRMWARE = build/applications/websocket-streaming/websocket-streaming.bin

all: firmware

firmware: $(SOURCES)
	cd build; $(MAKE) USE_SWD_JTAG=y APP=websocket-streaming

flash: firmware
	sudo spark flash --usb $(FIRMWARE)

.PHONY: all flash

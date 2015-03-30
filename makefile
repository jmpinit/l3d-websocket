SRC_DIR = applications/websocket-streaming
SOURCES = $(SRC_DIR)/*.cpp $(SRC_DIR)/*.h
FIRMWARE = build/applications/websocket-streaming/websocket-streaming.bin

all: $(FIRMWARE)

firmware: $(SOURCES)
	cd build; $(MAKE) APP=websocket-streaming

flash: firmware
	if [ -e /dev/ttyACM0 ] ; \
	    then \
	    echo 'b' > /dev/ttyACM0 ; \
	    fi;
	sudo spark flash --usb $(FIRMWARE)

.PHONY: all flash

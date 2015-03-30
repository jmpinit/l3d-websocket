#define PIN_RESET 19 // spark core reset line on A5

void setup() {
    Serial.begin(115200);
}

void loop() {
    while(Serial.available() > 0) {
        switch(Serial.read()) {
            case '?':
                identify();
                break;
            case 'r':
                reset();
                Serial.println("ok");
                break;
        }
    }
}

void identify() {
    Serial.println("`reset");
}

void reset() {
    digitalWrite(2, LOW);
    pinMode(19, OUTPUT);
    delay(50);
    pinMode(19, INPUT);
}

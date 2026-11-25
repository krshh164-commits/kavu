#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <BH1750.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ESP32 sensor bridge: USB Serial for laptop + BLE notifications for Android.
const int I2C_SDA = 21;
const int I2C_SCL = 22;
const int SOIL_PIN = 34;
const int DRY_VALUE = 3000;
const int WET_VALUE = 1200;

static const char* SERVICE_UUID = "9a6f1000-7b3a-4e35-a3d2-55d91a4c1000";
static const char* READINGS_UUID = "9a6f1001-7b3a-4e35-a3d2-55d91a4c1000";

Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp;
BH1750 lightMeter;
BLECharacteristic* readingsCharacteristic = nullptr;
bool ahtOK = false;
bool bmpOK = false;
bool bhOK = false;
bool deviceConnected = false;

class KavuServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) override { deviceConnected = true; }
  void onDisconnect(BLEServer*) override {
    deviceConnected = false;
    BLEDevice::startAdvertising();
  }
};

int readSoilAverage() {
  long total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(SOIL_PIN);
    delay(10);
  }
  return total / 10;
}

String jsonNumber(float value, int decimals) {
  if (!isfinite(value)) return "null";
  return String(value, decimals);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Wire.begin(I2C_SDA, I2C_SCL);

  Serial.println("\n=== Kāvu Sensor System ===");
  ahtOK = aht.begin();
  Serial.println(ahtOK ? "[OK] AHT20 temperature/humidity" : "[ERROR] AHT20 not found");
  bmpOK = bmp.begin(0x76) || bmp.begin(0x77);
  Serial.println(bmpOK ? "[OK] BMP280 pressure" : "[ERROR] BMP280 not found");
  bhOK = lightMeter.begin();
  Serial.println(bhOK ? "[OK] BH1750 light" : "[ERROR] BH1750 not found");
  Serial.println("[OK] Soil moisture on P34");

  BLEDevice::init("Kavu-Sensor");
  BLEDevice::setMTU(185);
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new KavuServerCallbacks());
  BLEService* service = server->createService(SERVICE_UUID);
  readingsCharacteristic = service->createCharacteristic(
    READINGS_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  readingsCharacteristic->addDescriptor(new BLE2902());
  readingsCharacteristic->setValue("{}");
  service->start();
  BLEDevice::startAdvertising();
  Serial.println("[OK] BLE ready: Kavu-Sensor");
}

void loop() {
  float tempC = NAN;
  float humidityPct = NAN;
  float pressureHpa = NAN;
  float lightLux = NAN;

  if (ahtOK) {
    sensors_event_t humidity, temp;
    aht.getEvent(&humidity, &temp);
    tempC = temp.temperature;
    humidityPct = humidity.relative_humidity;
  }
  if (bmpOK) pressureHpa = bmp.readPressure() / 100.0F;
  if (bhOK) {
    float value = lightMeter.readLightLevel();
    if (value >= 0) lightLux = value;
  }

  int rawSoil = readSoilAverage();
  int soilPercent = map(rawSoil, DRY_VALUE, WET_VALUE, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  // Keep an easy-to-read Serial Monitor line for laptop debugging.
  Serial.print("Temp: "); Serial.print(isfinite(tempC) ? String(tempC, 1) : "N/A");
  Serial.print(" °C | Humidity: "); Serial.print(isfinite(humidityPct) ? String(humidityPct, 1) : "N/A");
  Serial.print(" % | Pressure: "); Serial.print(isfinite(pressureHpa) ? String(pressureHpa, 1) : "N/A");
  Serial.print(" hPa | Light: "); Serial.print(isfinite(lightLux) ? String(lightLux, 1) : "N/A");
  Serial.print(" lx | Soil: "); Serial.print(soilPercent);
  Serial.print("% (Raw: "); Serial.print(rawSoil); Serial.println(")");

  // Machine-readable packet shared by USB Serial and BLE.
  String packet = "{\"tempC\":" + jsonNumber(tempC, 1)
    + ",\"humidityPct\":" + jsonNumber(humidityPct, 1)
    + ",\"pressureHpa\":" + jsonNumber(pressureHpa, 1)
    + ",\"lightLux\":" + jsonNumber(lightLux, 1)
    + ",\"soilPct\":" + String(soilPercent)
    + ",\"soilRaw\":" + String(rawSoil) + "}";
  Serial.println(packet);

  if (deviceConnected && readingsCharacteristic) {
    readingsCharacteristic->setValue(packet.c_str());
    readingsCharacteristic->notify();
  }
  delay(2000);
}

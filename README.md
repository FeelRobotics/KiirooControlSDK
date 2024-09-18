# Kiiroo Control SDK

The Kiiroo Control SDK allows easy connection and control of Kiiroo devices via Bluetooth. This SDK is designed to interact with devices using the Bluetooth Low Energy (BLE) protocol and supports a wide range of features, including battery level monitoring, device control, and over-the-air (OTA) firmware updates.

### Key Features:
- **Device Control**: Connect to Kiiroo devices using their unique MAC address.
- **Read Device Information**: Retrieve the device's serial number, model, and current firmware.
- **Battery Level Monitoring**: Continuously track the device's battery status.
- **Firmware Updates**: Supports OTA updates for convenient wireless firmware upgrades.
- **Acceleration Sensor**: Read data from the device’s 3D accelerometer to monitor movements.

These features make Kiiroo devices easy to use for both end-users and developers, providing simple ways to control and configure them.

#### Modes supported by the device:
- **Bluetooth Keyboard Mode**: An alternative mode, indicated by blinking green light.
- **Bluetooth Control Mode**: This mode allows the SDK to connect to and control the device over BLE (indicated by blinking blue).


#### Key Control Commands:
- **Power On/Off**: Press and hold the power button for 3-4 seconds.
- **Factory Reset**: Hold the power button for 10 seconds.
- **Switch Bluetooth Mode**: Single press of the power button to toggle between control modes.


### SDK Structure

#### Supported Bluetooth Mode:
- **Bluetooth Control Mode**: This mode allows the SDK to connect to and control the device over BLE. When the device is in **Bluetooth Control Mode**, it will pair and communicate with a smartphone, laptop, or another compatible BLE-enabled device.

### BLE Services and Characteristics

The SDK utilizes BLE services and characteristics to communicate with and control the device. Below are the key services and their respective characteristics:

- **Toy Control Service UUID**: `00001400-0000-1000-8000-00805f9b34fb` — the main service for controlling the device.
  - **Manufacturer Name**: `GATT_MANUFACTURER_NAME_UUID` (0x2A29) — reads the manufacturer information.
  - **Model Number**: `GATT_MODEL_NUMBER_UUID` (0x2A24) — reads the model number.
  - **Serial Number**: `GATT_SERIAL_NUMBER_UUID` (0x2A25) — retrieves the serial number of the device.
  - **Battery Level**: `GATT_BATTERY_LEVEL_UUID` (0x2A19) — allows the device's battery level to be read and notifications to be sent when the level changes.
  - **Acceleration Data**: Characteristics for X, Y, and Z-axis accelerations:
    - X-axis: `CHAR_X_UUID` (0xFFF1)
    - Y-axis: `CHAR_Y_UUID` (0xFFF2)
    - Z-axis: `CHAR_Z_UUID` (0xFFF3)

#### OTA (Over-The-Air) Firmware Update

Although the SDK focuses on **Bluetooth Control Mode**, it also provides functionality for over-the-air (OTA) updates to keep the device firmware up-to-date.

- **OTA Data**: `GATT_OTA_DATA_UUID` (0x1701) — used to read, write, and notify OTA data.
- **OTA Control**: `GATT_OTA_CONTROL_UUID` (0x1702) — sends control commands to initiate the OTA update process.

### Working with MTU (Maximum Transmission Unit)

By default, the MTU for BLE communication is 23 bytes across Android, iOS, and Windows. To optimize the performance of data transmission, especially during OTA updates, the MTU can be negotiated to a larger size, up to 255 bytes, to reduce the transfer time for large data packets.

- **MTU Negotiation**: The SDK supports MTU negotiation, allowing faster data transfer rates during OTA updates or when sending larger data packets.

### React and React Native SDK Support

This SDK is compatible with both React and React Native, providing flexibility for developers working on web or mobile applications:

- **React SDK**: The `kiiroo-control-react` module is the main entry point for React applications.
  - It includes support for Bluetooth connectivity and the features mentioned above.
  - Key dependencies include `@types/web-bluetooth` and `react`.

- **React Native SDK**: The `kiiroo-control-react-native` module extends the functionality to React Native applications, integrating with `react-native-ble-manager` for Bluetooth management on mobile devices.

### Key Development Scripts

Both SDKs come with a set of useful development scripts for building, testing, and linting:

- `build`: Compiles the SDK into distributable bundles.
- `test`: Runs unit tests to ensure the SDK is functioning as expected.
- `lint`: Lints the TypeScript codebase to enforce code quality and consistency.

### Example Workflow

1. **Connecting to a Device**:
   - Scan for available BLE devices.
   - Connect to the device via **Bluetooth Control Mode**.
   
2. **Reading Device Information**:
   - Retrieve the device's manufacturer, model, serial number, and battery level using the appropriate GATT characteristics.

3. **Controlling the Device**:
   - Send commands via the `Toy Control Service` to adjust device settings, such as triggering vibration modes or resetting the device to factory settings.

4. **Performing OTA Updates**:
   - Use the OTA characteristics to upload new firmware to the device, ensuring it is up-to-date with the latest features and improvements.

---

This SDK offers comprehensive BLE control for Kiiroo devices, including full device management through **Bluetooth Control Mode**, battery monitoring, and firmware updates.


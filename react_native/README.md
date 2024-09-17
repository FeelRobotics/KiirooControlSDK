# Kiiroo Control Bluetooth Service for React Native

## Overview
This class allows you to interact with Kiiroo Control devices via Bluetooth using the React Native BLE Manager. It provides methods for connecting, disconnecting, flashing firmware, reading sensor data, and retrieving device information.

## Features
- Connect and disconnect from Kiiroo Control devices
- Read sensor data from x, y, and z axes
- Retrieve device information such as battery level, firmware version, and hardware version
- Flash firmware to the device
- Support for subscribing and unsubscribing to sensor events
- Compatible with both iOS and Android, with platform-specific handling of MTU size and OTA updates

## Installation
This module assumes that you have installed `react-native-ble-manager`. You can install it with the following commands:

```bash
npm install react-native-ble-manager
react-native link react-native-ble-manager
```

## Usage

### Connecting to the Device
To connect to a Kiiroo Control device, use the `connect()` method after discovering the device.

```typescript
import { KiirooControl } from './KiirooControl';

// Create an instance of KiirooControl
const kiirooControl = new KiirooControl();

// Connect to the device
const device = { id: 'device_id' }; // Replace with your Bluetooth device ID
await kiirooControl.connect(device);
```

### Disconnecting from the Device
Ensure to properly disconnect from the device when you're done using it.

```typescript
await kiirooControl.disconnect();
```

### Reading Sensor Data
To receive real-time sensor data from the x, y, and z axes, the class sets up notifications from the device's characteristics.

```typescript
kiirooControl.sensor.on('data', (acceleration) => {
  console.log('Acceleration:', acceleration);
});
```

### Retrieving Device Information
You can easily retrieve the battery level, firmware version, and other details from the connected device:

```typescript
const batteryLevel = await kiirooControl.getBattery();
console.log('Battery Level:', batteryLevel);

const firmwareVersion = await kiirooControl.getFirmwareVersion();
console.log('Firmware Version:', firmwareVersion.version);
```

### Flashing Firmware
The `flashFirmware` method allows you to update the device firmware. You can also track progress via a callback.

```typescript
const firmwareData = new ArrayBuffer(); // Load your firmware data here
await kiirooControl.flashFirmware(firmwareData, (progress) => {
  console.log(`Firmware update progress: ${progress}%`);
});
```

## Methods

### `connect()`
Connects to the Bluetooth device and sets up sensor data subscriptions.
- **Returns**: `Promise<void>`

### `disconnect()`
Disconnects from the device and stops all active notifications.
- **Returns**: `Promise<void>`

### `getFirmwareVersion()`
Retrieves the firmware version from the connected device.
- **Returns**: `Promise<{ code: string, version: string }>`
  
### `getBattery()`
Retrieves the battery level of the connected device.
- **Returns**: `Promise<number>`

### `flashFirmware(firmware: ArrayBuffer, onProgress?: (percent: number) => void)`
Flashes a new firmware to the device.
- **Parameters**:
  - `firmware`: The firmware data to be flashed
  - `onProgress`: Optional callback to track the progress of the update
- **Returns**: `Promise<void>`

### `testDevice()`
Triggers a test on the device (e.g., blinking LEDs).
- **Returns**: `Promise<void>`

### `isConnected()`
Checks if the device is currently connected.
- **Returns**: `Promise<boolean>`

### `keepAlive()`
Ensures that the connection to the device is still active by reading a characteristic.
- **Returns**: `Promise<void>`

## Platform-Specific Considerations

### MTU Size
- **iOS**: Default MTU size is 185 bytes, no need to request a change.
- **Android**: The MTU size can be increased up to 512 bytes (if supported), but defaults to 23 bytes. You can request an increase based on the Android version.

## License
This project is licensed under the MIT License.

---

This class provides a robust interface to Kiiroo Control devices for React Native applications, simplifying Bluetooth communication and device management.
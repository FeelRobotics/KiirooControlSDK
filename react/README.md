# Kiiroo Control Bluetooth Service

## Overview
This module provides functionality to interact with Kiiroo Control devices via Bluetooth using Web Bluetooth API. It handles various Bluetooth GATT services and characteristics such as firmware updates, sensor data retrieval, and device information.

## Features
- Connection and disconnection management for Kiiroo Control devices.
- Handling sensor data from x, y, and z axes.
- Retrieve device information such as battery level, firmware version, serial number, model number, and manufacturer name.
- Flash Over-the-Air (OTA) firmware to the device.
- Support for setting up custom event listeners for sensor data changes.
  
## Installation
This module can be installed using any package manager, such as npm or yarn:

```bash
npm install kiiroo-control
```

Or

```bash
yarn add kiiroo-control
```

## Usage

### Connecting to the Device
The `KiirooControl` class provides an interface to search for and connect to a Bluetooth device.

```typescript
import { KiirooControl } from 'kiiroo-control';

// Create an instance of KiirooControl
const kiirooControl = new KiirooControl();

// Request and connect to the Kiiroo Control device
const device = await navigator.bluetooth.requestDevice(KiirooControl.requestDeviceOptions);
await kiirooControl.connect(device);
```

### Sensor Data Handling
You can set up a callback to receive updates when sensor data for the x, y, or z axes changes.

```typescript
kiirooControl.setEventListenerCallBack((x, y, z) => {
  console.log(`Sensor data - X: ${x}, Y: ${y}, Z: ${z}`);
});
```

### Retrieving Device Information
You can retrieve various pieces of information from the device, such as firmware version, serial number, and battery level.

```typescript
const firmwareVersion = await kiirooControl.getFirmwareVersion();
console.log(`Firmware Version: ${firmwareVersion}`);

const batteryLevel = await kiirooControl.getBattery();
console.log(`Battery Level: ${batteryLevel}%`);
```

### Flashing Firmware
The `flashFirmware` function allows you to update the device's firmware. You can also monitor the progress of the update.

```typescript
const firmwareData = new ArrayBuffer(); // Load firmware data
await kiirooControl.flashFirmware(firmwareData, percent => {
  console.log(`Firmware update progress: ${percent}%`);
});
```

### Disconnecting
Always ensure to disconnect from the device when you are done.

```typescript
await kiirooControl.disconnect();
```

## Constants

- `KIIROO_CONTROL_SERVICE_UUID`: UUID for the Kiiroo Control service.
- `OTA_DATA_UUID`, `OTA_CONTROL_UUID`: UUIDs used for OTA firmware updates.
- `BATTERY_LEVEL_UUID`: UUID to read the battery level.
- `FIRMWARE_NUMBER_UUID`, `SERIAL_NUMBER_UUID`, `MODEL_NUMBER_UUID`, `MANUFACTURER_NAME_UUID`: UUIDs to retrieve device information.

## License
This project is open-source and available under the MIT License.

---

For more detailed examples and API references, please refer to the documentation or open issues in the repository.
import BleManager from 'react-native-ble-manager';
import { Platform } from 'react-native';
import * as BleManagerSensor from './BleManagerSensor';
import { DeviceSensorEvents } from './DeviceSensorEvents';
import { IDevice as Device } from './IDevice';

/**
 * Bluetooth service UUID for Kiiroo Control devices.
 */
const KIIROO_CONTROL_SERVICE_UUID = '1400';
const DISCONNECT_DEVICE_UUID = '1501';

// OTA (Over-The-Air) update
/**
 * UUID for OTA (Over-the-Air) firmware data characteristic.
 */
const OTA_DATA_UUID = '1701';
/**
 * UUID for OTA control characteristic.
 */
const OTA_CONTROL_UUID = '1702';

/**
 * UUID for the device name service.
 */
const TEST_DEVICE_DEVICE_NAME_SERVICE_UUID = '180A';

/**
 * UUID for the battery level characteristic.
 */
const BATTERY_LEVEL_UUID = '2A19';
/**
 * UUID for the model number characteristic.
 */
const MODEL_NUMBER_UUID = '2A24';
/**
 * UUID for the serial number characteristic.
 */
const SERIAL_NUMBER_UUID = '2A25';
/**
 * UUID for the firmware version characteristic.
 */
const FIRMWARE_NUMBER_UUID = '2A26';
/**
 * UUID for the hardware version characteristic.
 */
const HARDWARE_NUMBER_UUID = '2A27';
/**
 * UUID for the manufacturer name characteristic.
 */
const MANUFACTURER_NAME_UUID = '2A29';
/**
 * UUID for the device name characteristic.
 */
const READ_NAME_UUID = '2A00';

/**
 * UUIDs for sensor characteristics.
 */
const CHAR_X_UUID = 'FFF1';
const CHAR_Y_UUID = 'FFF2';
const CHAR_Z_UUID = 'FFF3';

const DEFAULT_MTU_SIZE = 23;
const IOS_MTU_SIZE = 185; // Default MTU size for iOS
const DESIRED_MTU_SIZE = 252; // Desired MTU size for Android
const DESIRED_MTU_SIZE_V_14 = 512; // MTU size for Android 14+

const SEND_CHUNK_DELAY = 1000; // ms
const DEVICE_REBOOT_WAIT_TIME = 5000; // ms

/**
 * Function that creates a promise to wait for a specified duration in milliseconds.
 * @param {number} msecs - Number of milliseconds to wait.
 * @param {string} [msg] - Optional message to log during the wait period.
 * @returns {Promise<void>}
 */
const wait = (msecs: number, msg: string = ''): Promise<void> =>
  new Promise((resolve) => {
    const text = msg === '' ? '' : `${msg} :`;
    console.debug(`${text} Wait ${msecs / 1000} sec...`);
    setTimeout(resolve, msecs);
  });

/**
 * Class to manage device sensor data (acceleration on X, Y, Z axes)
 */
class DeviceData {
  _axisX: number;
  _axisY: number;
  _axisZ: number;

  constructor(axisX = 0, axisY = 0, axisZ = 0) {
    this._axisX = axisX;
    this._axisY = axisY;
    this._axisZ = axisZ;
  }

  /**
   * Gets the current value of the X axis.
   * @returns {number} - The X axis value.
   */
  public get axisX(): number {
    return this._axisX;
  }

  /**
   * Gets the current value of the Y axis.
   * @returns {number} - The Y axis value.
   */
  public get axisY(): number {
    return this._axisY;
  }

  /**
   * Gets the current value of the Z axis.
   * @returns {number} - The Z axis value.
   */
  public get axisZ(): number {
    return this._axisZ;
  }

  /**
   * Calculates total acceleration based on X, Y, and Z axes.
   * @returns {number} Total acceleration value.
   */
  public calculateTotalAcceleration(): number {
    const result = Math.sqrt(
      this._axisX ** 2 + this._axisY ** 2 + this._axisZ ** 2
    );
    return Math.min(Math.round(result), 5);
  }

  /**
   * Sets axis value based on the given property name.
   * @param {string} propName - UUID of the axis (CHAR_X_UUID, CHAR_Y_UUID, or CHAR_Z_UUID).
   * @param {number} value - Value to set for the axis.
   */
  set_fffx(propName: string, value: number) {
    switch (propName) {
      case CHAR_X_UUID:
        this._axisX = value;
        break;
      case CHAR_Y_UUID:
        this._axisY = value;
        break;
      case CHAR_Z_UUID:
        this._axisZ = value;
        break;
      default:
        throw new Error(`Property ${propName} does not exist on DeviceData.`);
    }
  }
}

/**
 * Class to control Kiiroo devices via Bluetooth.
 */
export class KiirooControl {
  private deviceNotInitMsg = 'The device should be connected first.';
  private deviceNotFound = 'The device is invalid or not found';

  private device?: Device;
  notificationData: DeviceData;
  acceleration: number;
  sensor: DeviceSensorEvents;

  constructor() {
    this.notificationData = new DeviceData();
    this.acceleration = 0;
    this.sensor = new DeviceSensorEvents();
  }

  private async writeChar(
    serviceChar: string,
    data: number[],
    maxByteSize?: number
  ): Promise<void> {
    if (!this.device || !(await this.isConnected())) {
      return Promise.reject(this.deviceNotInitMsg);
    }

    return await BleManager.write(
      this.device.id,
      KIIROO_CONTROL_SERVICE_UUID,
      serviceChar,
      data,
      maxByteSize
    );
  }

  private async readChar(serviceChar: string): Promise<number[]> {
    if (!this.device || !(await this.isConnected())) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    return await BleManager.read(
      this.device.id,
      KIIROO_CONTROL_SERVICE_UUID,
      serviceChar
    );
  }

  private convertToString(data?: number[]): string {
    let response = 'N/A';
    if (data) {
      const chars = data.map((code: number) => String.fromCharCode(code));
      response = chars.join('');
    }
    return response;
  }

  /**
   * Check if the device name matches 'CONTROL'.
   * @param {string} deviceName - The name of the Bluetooth device.
   * @returns {boolean} True if the device name is 'CONTROL'.
   */
  nameMatch(deviceName: string): boolean {
    return deviceName.toUpperCase().trim() === 'CONTROL';
  }

  /**
   * Returns a fixed device name for Kiiroo Control devices.
   * @returns {string} Device name.
   */
  deviceName(): string {
    return 'control';
  }

  /**
   * Disconnect the Bluetooth device.
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (!this.device || !(await this.isConnected())) {
      return Promise.reject(this.deviceNotInitMsg);
    }

    [CHAR_X_UUID, CHAR_Y_UUID, CHAR_Z_UUID].forEach(
      async (char) =>
        await BleManager.stopNotification(
          this.device!.id,
          KIIROO_CONTROL_SERVICE_UUID,
          char
        )
    );
    await BleManagerSensor.unsubscribe(this.device.id);
    if (Platform.OS === 'android') {
      await this.writeChar(DISCONNECT_DEVICE_UUID, [0]);
    }
    return await BleManager.disconnect(this.device.id);
  }

  /**
   * Connect to the Bluetooth device and subscribe to notifications for X, Y, Z axes.
   * @returns {Promise<void>}
   */
  async connect(device: Device): Promise<void> {
    if (!device) {
      return Promise.reject(this.deviceNotFound);
    }

    this.device = device;
    this.notificationData = new DeviceData();
    try {
      await BleManager.connect(this.device.id);
      await BleManager.retrieveServices(this.device.id);
      await BleManagerSensor.subscribe(
        this.device.id,
        KIIROO_CONTROL_SERVICE_UUID,
        CHAR_X_UUID
      );
      await BleManagerSensor.subscribe(
        this.device.id,
        KIIROO_CONTROL_SERVICE_UUID,
        CHAR_Y_UUID
      );
      await BleManagerSensor.subscribe(
        this.device.id,
        KIIROO_CONTROL_SERVICE_UUID,
        CHAR_Z_UUID,
        (data: { characteristic: string; value: [''] }) => {
          if (data?.characteristic) {
            this.notificationData.set_fffx(
              data.characteristic,
              Number(data.value[0])
            );
          }
          const percent =
            this.notificationData.calculateTotalAcceleration();

          if (typeof percent === 'number' && this.acceleration !== percent) {
            this.acceleration = percent;
            this.sensor.emit(device, Math.min(percent * 20, 100));
          }
        }
      );
    } catch (err) {
      console.error('Error while connecting to device', err);
      this.disconnect();
      return Promise.reject(`${this.deviceNotFound}: ${err}`);
    }
  }

  /**
   * Check if the device is connected.
   * @returns {Promise<boolean>}
   */
  async isConnected(): Promise<boolean> {
    if (this.device) {
      return await BleManager.isPeripheralConnected(this.device.id);
    }
    return false;
  }

  /**
   * Retrieves the firmware version from the connected device.
   * @returns {Promise<string>} - The firmware version as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getFirmwareVersion(): Promise<string> {
    const data = await this.readChar(FIRMWARE_NUMBER_UUID);
    return this.convertToString(data);
  }

  /**
   * Retrieves the serial number from the connected device.
   * @returns {Promise<string>} - The serial number as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getSerialNumber(): Promise<string> {
    const data = await this.readChar(SERIAL_NUMBER_UUID);
    return this.convertToString(data);
  }

  /**
   * Retrieves the model number from the connected device.
   * @returns {Promise<string>} - The model number as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getModelNumber(): Promise<string> {
    const data = await this.readChar(MODEL_NUMBER_UUID);
    return this.convertToString(data);
  }

  /**
   * Retrieves the manufacturer name from the connected device.
   * @returns {Promise<string>} - The manufacturer name as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getManufactureName(): Promise<string> {
    const data = await this.readChar(MANUFACTURER_NAME_UUID);
    return this.convertToString(data);
  }

  /**
   * Retrieves the device name from the connected device.
   * @returns {Promise<string>} - The device name as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getDeviceName(): Promise<string> {
    const data = await this.readChar(READ_NAME_UUID);
    return this.convertToString(data);
  }

  /**
   * Keep the Bluetooth connection alive by reading the hardware number.
   * @returns {Promise<void>}
   */
  async getHardwareVersion(): Promise<string> {
    const data = await this.readChar(HARDWARE_NUMBER_UUID);
    return this.convertToString(data);
  }

  /**
   * Retrieve battery level from the device.
   * @returns {Promise<number>} Battery level as a percentage.
   */
  async getBattery(): Promise<number> {
    const readData = await this.readChar(BATTERY_LEVEL_UUID);
    return readData[0];
  }

  /**
   * Send a test signal to the device, typically to blink LEDs.
   * @returns {Promise<void>}
   */
  async testDevice(): Promise<void> {
    await this.writeChar(TEST_DEVICE_DEVICE_NAME_SERVICE_UUID, [0]);
  }

  /**
   * Flash new firmware to the Bluetooth device.
   * @param {any} firmware - Firmware data to be flashed.
   * @param {Function} [onProgress=null] - Optional progress callback.
   * @returns {Promise<void>}
   */
  async flashFirmware(
    firmware: any,
    onProgress: ((percent: number) => void) | null = null
  ): Promise<void> {

    if (!this.device || !(await this.isConnected())) {
      return Promise.reject(this.deviceNotInitMsg);
    }

    const versionNumber =
      typeof Platform.Version === 'string'
        ? parseFloat(Platform.Version)
        : Platform.Version;
    let mtuSize = DEFAULT_MTU_SIZE;
    if (Platform.OS === 'ios') {
      mtuSize = IOS_MTU_SIZE;
    } else {
      mtuSize = await BleManager.requestMTU(
        this.device.id,
        versionNumber >= 34 ? DESIRED_MTU_SIZE_V_14 : DESIRED_MTU_SIZE
      );
    }
    const packetSize = mtuSize - 3;

    const chunks = [];
    for (let i = 0; i < firmware.length; i += packetSize) {
      chunks.push(firmware.slice(i, i + packetSize));
    }

    await this.writeChar(OTA_DATA_UUID, [
      packetSize,
      versionNumber >= 34 ? 1 : 0
    ]);

    await wait(SEND_CHUNK_DELAY);

    console.debug('Sending OTA request');
    await this.writeChar(OTA_CONTROL_UUID, [0x01]);

    await wait(SEND_CHUNK_DELAY);

    const data = await this.readChar(OTA_CONTROL_UUID);
    console.debug('OTA Control data', data);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await this.writeChar(OTA_DATA_UUID, chunk, chunk.length);
      onProgress?.(Math.round((i / chunks.length) * 100));
      console.debug('Sent chunk', i, 'of', chunks.length);
    }

    console.debug('Sending OTA done');

    if (Platform.OS === 'ios') {
      await this.writeChar(OTA_CONTROL_UUID, [0x04], 1);
    } else {
      await BleManager.writeWithoutResponse(
        this.device.id,
        KIIROO_CONTROL_SERVICE_UUID,
        OTA_CONTROL_UUID,
        [0x04],
        1
      );
    }

    console.debug('Waiting for device to reboot');
    await wait(DEVICE_REBOOT_WAIT_TIME);

    if (!(await this.isConnected())) {
      console.debug('Device is not connected');
      await this.connect(this.device);
    }
  }
}

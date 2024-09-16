/**
 * Bluetooth service UUID for Kiiroo Control devices.
 */
export const KIIROO_CONTROL_SERVICE_UUID: BluetoothServiceUUID = 0x1400;

// Flash firmware characteristic UUIDs
/**
 * UUID for OTA (Over-the-Air) firmware data characteristic.
 */
const OTA_DATA_UUID: BluetoothCharacteristicUUID = 0x1701;
/**
 * UUID for OTA control characteristic.
 */
const OTA_CONTROL_UUID: BluetoothCharacteristicUUID = 0x1702;

// Device information characteristic UUIDs
/**
 * UUID for the device name service.
 */
const TEST_DEVICE_DEVICE_NAME_SERVICE_UUID: BluetoothCharacteristicUUID = 0x180a;

/**
 * UUID for the battery level characteristic.
 */
const BATTERY_LEVEL_UUID: BluetoothCharacteristicUUID = 0x2a19;

/**
 * UUID for the firmware version characteristic.
 */
const FIRMWARE_NUMBER_UUID: BluetoothCharacteristicUUID = 0x2a26;
/**
 * UUID for the hardware version characteristic.
 */
const HARDWARE_NUMBER_UUID: BluetoothCharacteristicUUID = 0x2a27;
/**
 * UUID for the serial number characteristic.
 */
const SERIAL_NUMBER_UUID: BluetoothCharacteristicUUID = 0x2a25;
/**
 * UUID for the model number characteristic.
 */
const MODEL_NUMBER_UUID: BluetoothCharacteristicUUID = 0x2a24;
/**
 * UUID for the manufacturer name characteristic.
 */
const MANUFACTURER_NAME_UUID: BluetoothCharacteristicUUID = 0x2a29;
/**
 * UUID for the device name characteristic.
 */
const READ_NAME_UUID: BluetoothCharacteristicUUID = 0x2a00;

/**
 * UUIDs for sensor characteristics.
 */
const CHAR_X_UUID: BluetoothCharacteristicUUID = 0xfff1;
const CHAR_Y_UUID: BluetoothCharacteristicUUID = 0xfff2;
const CHAR_Z_UUID: BluetoothCharacteristicUUID = 0xfff3;

// Other constants
/**
 * Default Maximum Transmission Unit (MTU) size in bytes.
 */
const DEFAULT_MTU_SIZE = 256;
/**
 * Delay in milliseconds between sending chunks of data.
 */
const SEND_CHUNK_DELAY = 1000; // ms
/**
 * Time in milliseconds to wait for the device to reboot.
 */
const DEVICE_REBOOT_WAIT_TIME = 5000; // ms

/**
 * Function that creates a promise to wait for a specified duration in milliseconds.
 * @param {number} msecs - Number of milliseconds to wait.
 * @param {string} [msg] - Optional message to log during the wait period.
 * @returns {Promise<void>}
 */
const wait = (msecs: number, msg: string = ''): Promise<void> =>
  new Promise(resolve => {
    const text = msg === '' ? '' : `${msg} :`;
    console.debug(`${text} Wait ${msecs / 1000} sec...`);
    setTimeout(resolve, msecs);
  });

/**
 * Callback function type for handling sensor data (x, y, z axes).
 */
export type EventListenerCallBackFunction = (
  x: number,
  y: number,
  z: number
) => void;

export class KiirooControl {
  // Axis state variables
  _axisX: number;
  _axisY: number;
  _axisZ: number;

  private device?: BluetoothDevice;
  private controlService: BluetoothRemoteGATTService | null;
  private sensorEventListenerCallBack: EventListenerCallBackFunction | null;
  private deviceNotInitMsg = 'The device should be connected first.';

  /**
   * Sets up a listener for a Bluetooth characteristic's value changes.
   * @param {BluetoothCharacteristicUUID} char - The characteristic UUID to listen for.
   * @param {(event: Event) => Promise<void>} handler - The handler function to call on value change.
   * @returns {Promise<void>}
   */
  private async setUpListener(
    char: BluetoothCharacteristicUUID,
    handler: (event: Event) => Promise<void>
  ): Promise<void> {
    let eChar = await this.controlService!.getCharacteristic(char);
    await eChar.startNotifications();

    eChar.addEventListener('characteristicvaluechanged', async event => {
      await handler.call(this, event);
    });
  }

  /**
   * Removes a listener from a Bluetooth characteristic's value changes.
   * @param {BluetoothCharacteristicUUID} char - The characteristic UUID to remove the listener from.
   * @param {(event: Event) => Promise<void>} handler - The handler function to remove.
   * @returns {Promise<void>}
   */
  private async removeListener(
    char: BluetoothCharacteristicUUID,
    handler: (event: Event) => Promise<void>
  ): Promise<void> {
    let eChar = await this.controlService!.getCharacteristic(char);
    await eChar.startNotifications();

    eChar.removeEventListener('characteristicvaluechanged', handler);
  }

  /**
   * Transforms an array of numbers or an ArrayBuffer into a Uint8Array.
   * @param {Array<number> | ArrayBuffer} arr - The array or ArrayBuffer to transform.
   * @returns {Uint8Array} - The transformed Uint8Array.
   * @throws {Error} - Throws if the input is not an Array or ArrayBuffer.
   */
  private tranformArrayToData(arr: Array<number> | ArrayBuffer): Uint8Array {
    let buffer: ArrayBuffer;

    if (Array.isArray(arr)) {
      buffer = new ArrayBuffer(arr.length);
      const view = new Uint8Array(buffer);
      arr.forEach((v, indx) => {
        view[indx] = v;
      });
      return view;
    } else if (arr instanceof ArrayBuffer) {
      return new Uint8Array(arr);
    } else {
      throw new Error(
        'Invalid input type. Expected Array<number> or ArrayBuffer.'
      );
    }
  }

  constructor() {
    this._axisX = 0;
    this._axisY = 0;
    this._axisZ = 0;
    this.controlService = null;
    this.sensorEventListenerCallBack = null;
  }

  /**
   * Handler for the X axis sensor event listener.
   * @param {Event} event - The event from the Bluetooth characteristic.
   * @returns {Promise<void>}
   */
  private async xSensorEventListener(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement | null;
    const dataView = target?.value;
    if (dataView) {
      const uint8Array = new Uint8Array((dataView as any).buffer);
      this._axisX = uint8Array[0];

      if (this.sensorEventListenerCallBack) {
        this.sensorEventListenerCallBack(this._axisX, this._axisY, this._axisZ);
      }
    }
  }

  /**
   * Handler for the Y axis sensor event listener.
   * @param {Event} event - The event from the Bluetooth characteristic.
   * @returns {Promise<void>}
   */
  private async ySensorEventListener(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement | null;
    const dataView = target?.value;
    if (dataView) {
      const uint8Array = new Uint8Array((dataView as any).buffer);

      this._axisY = uint8Array[0];
      if (this.sensorEventListenerCallBack) {
        this.sensorEventListenerCallBack(this._axisX, this._axisY, this._axisZ);
      }
    }
  }

  /**
   * Handler for the Z axis sensor event listener.
   * @param {Event} event - The event from the Bluetooth characteristic.
   * @returns {Promise<void>}
   */
  private async zSensorEventListener(event: Event): Promise<void> {
    const target = event.currentTarget as HTMLInputElement | null;
    const dataView = target?.value;
    if (dataView) {
      const uint8Array = new Uint8Array((dataView as any).buffer);

      this._axisZ = uint8Array[0];
      if (this.sensorEventListenerCallBack) {
        this.sensorEventListenerCallBack(this._axisX, this._axisY, this._axisZ);
      }
    }
  }

  /**
   * Matches the provided device name with the expected name for the Kiiroo Control device.
   * @param {string} deviceName - The name of the Bluetooth device.
   * @returns {boolean} - True if the names match, otherwise false.
   */
  static nameMatch(deviceName: string): boolean {
    return deviceName.toUpperCase().trim() === this.deviceName.toUpperCase();
  }

  /**
   * Getter for the expected Bluetooth device name.
   * @returns {string} - The expected device name.
   */
  static get deviceName(): string {
    return 'Control';
  }

  /**
   * Provides the request options for the Bluetooth device.
   * @returns {RequestDeviceOptions} - The options for requesting a Bluetooth device.
   */
  static get requestDeviceOptions(): RequestDeviceOptions {
    return {
      filters: [{ name: this.deviceName }],
      optionalServices: [KIIROO_CONTROL_SERVICE_UUID],
    };
  }

  /**
   * Sets the callback function for handling sensor events (x, y, z axes).
   * @param {EventListenerCallBackFunction} cb - The callback function to set.
   */
  public setEventListenerCallBack(cb: EventListenerCallBackFunction) {
    this.sensorEventListenerCallBack = cb;
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
   * Retrieves the firmware version from the connected device.
   * @returns {Promise<string>} - The firmware version as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getFirmwareVersion(): Promise<string> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const firmwareChar = await this.controlService.getCharacteristic(
      FIRMWARE_NUMBER_UUID
    );
    const data = await firmwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }
    const version = chars.join('');
    return version;
  }

  /**
   * Retrieves the serial number from the connected device.
   * @returns {Promise<string>} - The serial number as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getSerialNumber(): Promise<string> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const hardwareChar = await this.controlService.getCharacteristic(
      SERIAL_NUMBER_UUID
    );

    const data = await hardwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }

    const serialNumber = chars.join('');
    return serialNumber;
  }

  /**
   * Retrieves the model number from the connected device.
   * @returns {Promise<string>} - The model number as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getModelNumber(): Promise<string> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const hardwareChar = await this.controlService.getCharacteristic(
      MODEL_NUMBER_UUID
    );
    const data = await hardwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }
    const modelNumber = chars.join('');
    return modelNumber;
  }

  /**
   * Retrieves the manufacturer name from the connected device.
   * @returns {Promise<string>} - The manufacturer name as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getManufactureName(): Promise<string> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const hardwareChar = await this.controlService.getCharacteristic(
      MANUFACTURER_NAME_UUID
    );
    const data = await hardwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }
    const manufactureName = chars.join('');
    return manufactureName;
  }

  /**
   * Retrieves the device name from the connected device.
   * @returns {Promise<string>} - The device name as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getDeviceName(): Promise<string> {
    console.log(
      '!this.controlService:',
      !this.controlService,
      this.controlService
    );

    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const hardwareChar = await this.controlService.getCharacteristic(
      READ_NAME_UUID
    );
    const data = await hardwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }
    const deviceName = chars.join('');
    return deviceName;
  }

  /**
   * Retrieves the hardware version from the connected device.
   * @returns {Promise<string>} - The hardware version as a string.
   * @throws {Error} - If the device is not connected.
   */
  async getHardwareVersion(): Promise<string> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const hardwareChar = await this.controlService.getCharacteristic(
      HARDWARE_NUMBER_UUID
    );
    const data = await hardwareChar.readValue();

    const chars = [];
    for (let i = 0; i < data.byteLength; i++) {
      chars.push(String.fromCharCode(data.getUint8(i)));
    }
    const hardwareVersion = chars.join('');
    return hardwareVersion;
  }

  /**
   * Retrieves the battery level of the connected device.
   * @returns {Promise<number>} - The battery level as a percentage (0-100).
   * @throws {Error} - If the device is not connected.
   */
  async getBattery(): Promise<number> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const batteryChar = await this.controlService.getCharacteristic(
      BATTERY_LEVEL_UUID
    );

    try {
      const readData = await batteryChar.readValue();
      if (readData) {
        return readData.getUint8(0);
      }
    } catch (e) {
      console.error('KiirooControl.getBattery:', e);
    }
    return -1;
  }

  /**
   * Checks if the device is connected.
   * @returns {boolean} - True if the device is connected, otherwise false.
   */
  isConnected(): boolean {
    return !!this.device?.gatt?.connected;
  }

  /**
   * Checks if the device has been initialized.
   * @returns {string} - Error message if the device is not connected, otherwise an empty string.
   */
  isDeviceInitialized(): string {
    let msg = '';
    if (!this.controlService || !this.isConnected) {
      msg = this.deviceNotInitMsg;
    }
    return msg;
  }

  /**
   * Disconnects from the Bluetooth device and removes event listeners.
   * @returns {Promise<void>} - Resolves when the device is disconnected.
   */
  async disconnect(): Promise<void> {
    try {
      await this.removeListener(CHAR_X_UUID, this.xSensorEventListener);
      await this.removeListener(CHAR_Y_UUID, this.ySensorEventListener);
      await this.removeListener(CHAR_Z_UUID, this.zSensorEventListener);
    } catch (err) {
      console.warn('Error while disconnecting the device: ', err);
    }
    this.device?.gatt!.disconnect();
  }

  /**
   * Connects to a Bluetooth device and sets up characteristic listeners.
   * @param {BluetoothDevice} device - The Bluetooth device to connect to.
   * @returns {Promise<void>} - Resolves when the device is successfully connected.
   * @throws {Error} - If there is an error during connection.
   */
  async connect(device: BluetoothDevice): Promise<any> {
    if (!device.gatt) {
      return Promise.reject('The device is invalid or not found');
    }

    this.device = device;

    const server: BluetoothRemoteGATTServer = await device.gatt.connect();
    this.controlService = await server.getPrimaryService(
      KIIROO_CONTROL_SERVICE_UUID
    );

    if (this.controlService) {
      try {
        this.setUpListener(CHAR_X_UUID, this.xSensorEventListener);
        this.setUpListener(CHAR_Y_UUID, this.ySensorEventListener);
        this.setUpListener(CHAR_Z_UUID, this.zSensorEventListener);
      } catch (err) {
        console.error('Error while connecting to device: ', err);
        this.disconnect();
        return Promise.reject(err);
      }

      console.debug('device succefully connected');
    }
  }

  /**
   * Runs a test on the connected device by blinking its LEDs.
   * @returns {Promise<void>} - Resolves when the test is complete.
   * @throws {Error} - If the device is not connected.
   */
  async testDevice(): Promise<any> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }
    const testChar = await this.controlService.getCharacteristic(
      TEST_DEVICE_DEVICE_NAME_SERVICE_UUID
    );

    let dt = this.tranformArrayToData([0]);
    await testChar.writeValue(dt);
  }

  /**
   * Flashes new firmware to the connected device.
   * @param {ArrayBuffer} firmware - The firmware to flash.
   * @param {(percent: number) => void} [onProgress] - Optional callback for progress updates.
   * @returns {Promise<void>} - Resolves when the firmware update is complete.
   * @throws {Error} - If the device is not connected.
   */
  async flashFirmware(
    firmware: ArrayBuffer,
    onProgress: ((percent: number) => void) | null = null
  ): Promise<void> {
    if (!this.controlService || !this.isConnected) {
      return Promise.reject(this.deviceNotInitMsg);
    }

    console.debug('Firmware size: ', firmware.byteLength);

    const packetSize = DEFAULT_MTU_SIZE - 3;

    // Split firmware into chunks of packetSize bytes
    const chunks = [];
    for (let i = 0; i < firmware.byteLength; i += packetSize) {
      chunks.push(firmware.slice(i, i + packetSize));
    }
    console.debug('chunks:', chunks.length);

    // Sending packet size
    const otaChar = await this.controlService.getCharacteristic(OTA_DATA_UUID);
    const otaCtrlChar = await this.controlService.getCharacteristic(
      OTA_CONTROL_UUID
    );

    let dt = this.tranformArrayToData([packetSize, 0]);
    await otaChar.writeValue(dt);

    // Wait 1 second
    await wait(SEND_CHUNK_DELAY, 'Sending packet size');

    dt = this.tranformArrayToData([0x01]);
    await otaCtrlChar.writeValue(dt);

    // Wait 1 second
    await wait(SEND_CHUNK_DELAY, 'Sending OTA request');

    // Send firmware chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      dt = this.tranformArrayToData(chunk);
      await otaChar.writeValue(dt);

      if (onProgress) {
        onProgress(Math.round((i / chunks.length) * 100));
      }
      console.debug('Sent chunk', i, 'of', chunks.length);
    }

    console.debug('Sending OTA done');

    // Send OTA done
    dt = this.tranformArrayToData([0x04]);
    await otaCtrlChar.writeValue(dt);

    await wait(DEVICE_REBOOT_WAIT_TIME, 'Waiting for device to reboot');
  }
}

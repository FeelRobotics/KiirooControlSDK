import EventEmitter from 'events';
import { IDevice as Device } from './IDevice';

const DEVICE_MESSAGE = 'DEVICE_MESSAGE';


/**
 * Class to subscribe to the sensor events for the specific device
 * and emit such events by the device.
 * Usage:
 *  // In the device module
 *  const sensor = new DeviceSensorEvents()
 *  sensor.emit(device, 50);
 *
 *  // In the subscriber (observer) module
 *  const listener = (device, percent) => { console.log(device, percent) };
 *  sensor.subscribe(device.id, listener);
 *  sensor.unsubscribe(device.id, listener);
 */
export class DeviceSensorEvents {
  private ee: EventEmitter;

  constructor() {
    this.ee = new EventEmitter();
  }

  private getMessageFromDeviceId(deviceId: string): string {
    return DEVICE_MESSAGE + deviceId;
  }

  /**
   * Send the device sensor event to the subscribers
   * @param {Device} device - device object
   * @param {number} percent - percent 0..100
   */
  emit(device: Device | null, percent: number): void {
    if (!device) {
      return;
    }
    this.ee.emit(this.getMessageFromDeviceId(device.id), device, percent);
  }

  /**
   * Subscribe for device sensor events for the device with given ID
   * @param {string} deviceId - device ID
   * @param {(device: Device, percent: number) => void} listener - listener function in format (device, percent) => {...}
   */
  subscribe(deviceId: string, listener: (device: Device, percent: number) => void): void {
    this.ee.addListener(this.getMessageFromDeviceId(deviceId), listener);
  }

  /**
   * Unsubscribe from the sensor events
   * @param {string} deviceId - device ID
   * @param {(device: Device, percent: number) => void} listener - listener function which was previously used with `subscribe`
   */
  unsubscribe(deviceId: string, listener: (device: Device, percent: number) => void): void {
    this.ee.removeListener(this.getMessageFromDeviceId(deviceId), listener);
  }
}



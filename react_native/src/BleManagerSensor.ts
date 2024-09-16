import BleManager from 'react-native-ble-manager';
import { NativeModules, NativeEventEmitter } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

interface CallbackInfo {
  callback?: (args: any) => void;
  service: string;
  characteristic: string;
}

const callbacks: { [key: string]: CallbackInfo } = {};

bleManagerEmitter.addListener(
  'BleManagerDidUpdateValueForCharacteristic',
  (args: { peripheral: any },
  ) => {

    const { peripheral } = args;
    if (!callbacks[peripheral]) {
      return;
    }
    const { callback } = callbacks[peripheral];
    if (!callback) {
      return;
    }
    callback(args);
  });

/**
 * Subscribe to BLE notifications
 * @param {string} deviceId - device id. If there is a previous subscription with this
 *                            device ID, the previous one will be lost.
 * @param {string} service - service UUID to subscribe
 * @param {string} characteristic - characteristic UUID to subscribe
 * @param {function} callback - callback to be called on BLE device notifications
 */
export const subscribe = async (
  deviceId: string,
  service: string,
  characteristic: string,
  callback?: (args: any) => void,
): Promise<void> => {

  await BleManager.startNotification(deviceId, service, characteristic);
  callbacks[deviceId] = {
    callback,
    service,
    characteristic,
  };

};

/**
 * Unsibscribe from BLE notifications.
 * @param {string} deviceId - device id.
 */
export const unsubscribe = async (deviceId: string): Promise<void> => {
  if (!callbacks[deviceId]) {
    return;
  }

  const { service, characteristic } = callbacks[deviceId];
  await BleManager.stopNotification(deviceId, service, characteristic);
  delete callbacks[deviceId];
};

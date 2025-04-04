import { KIIROO_CONTROL_SERVICE_UUID, KiirooControl } from '../KiirooControl';

describe('Kiiroo Control class', () => {
  test('nameMatch', () => {
    expect(KiirooControl.nameMatch('control')).toBeTruthy();
  });
  test('requestDeviceOptions', () => {
    const expected = {
      filters: [{ name: 'Control' }],
      optionalServices: [KIIROO_CONTROL_SERVICE_UUID],
    };
    expect(KiirooControl.requestDeviceOptions).toEqual(expected);
  });
});

describe('Kiiroo Control', () => {
  let kiirooControl: KiirooControl;
  const devNotInit = 'The device should be connected first.';
  beforeEach(() => {
    kiirooControl = new KiirooControl();
  });
  test('axisX', () => {
    expect(kiirooControl.axisX).toEqual(0);
  });
  test('axisY', () => {
    expect(kiirooControl.axisY).toEqual(0);
  });
  test('axisZ', () => {
    expect(kiirooControl.axisZ).toEqual(0);
  });
  test('isConnected', () => {
    expect(kiirooControl.isConnected()).toBeFalsy();
  });
  test('getDeviceState', () => {
    expect(kiirooControl.getDeviceState()).toEqual(devNotInit);
  });
  test('setEventListenerCallBack', () => {
    expect(kiirooControl.setEventListenerCallBack(() => {})).toBeUndefined();
  });
  test('disconnect', async () => {
    await expect(kiirooControl.disconnect()).resolves.toBeUndefined();
  });
  test('testDevice', async () => {
    await expect(kiirooControl.testDevice()).rejects.toEqual(devNotInit);
  });
  test('flashFirmware', async () => {
    await expect(
      kiirooControl.flashFirmware(new ArrayBuffer(0))
    ).rejects.toEqual(devNotInit);
  });
  test('getBattery', async () => {
    await expect(kiirooControl.getBattery()).rejects.toEqual(devNotInit);
  });
  test('getHardwareVersion', async () => {
    await expect(kiirooControl.getHardwareVersion()).rejects.toEqual(
      devNotInit
    );
  });
  test('getDeviceName', async () => {
    await expect(kiirooControl.getDeviceName()).rejects.toEqual(devNotInit);
  });
  test('getManufactureName', async () => {
    await expect(kiirooControl.getManufactureName()).rejects.toEqual(
      devNotInit
    );
  });
  test('getModelNumber', async () => {
    await expect(kiirooControl.getModelNumber()).rejects.toEqual(devNotInit);
  });
  test('getSerialNumber', async () => {
    await expect(kiirooControl.getSerialNumber()).rejects.toEqual(devNotInit);
  });
  test('getFirmwareVersion', async () => {
    await expect(kiirooControl.getFirmwareVersion()).rejects.toEqual(
      devNotInit
    );
  });
});

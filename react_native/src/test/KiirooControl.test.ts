import { IDevice } from '../IDevice';

import { KiirooControl } from '../KiirooControl';

class Device implements IDevice {
  id = 'id';
  name = 'name';
}

describe('Kiiroo Control', () => {
  let device: Device;
  let control: KiirooControl;

  beforeEach(() => {
    device = new Device();
    control = new KiirooControl();
  });

  test('deviceName', () => {
    expect(control.deviceName()).toEqual('control');
  });
  test('nameMatch', () => {
    expect(control.nameMatch('control')).toBeTruthy();
  });
});

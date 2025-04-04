const BleManager = {
  start: jest.fn(),
  scan: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  read: jest.fn(),
  write: jest.fn(),
  retrieveServices: jest.fn(),
  isPeripheralConnected: jest.fn()
};

export default BleManager;

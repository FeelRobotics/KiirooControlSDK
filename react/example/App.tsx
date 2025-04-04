import React, { useState, useRef, useEffect } from 'react';
import { KiirooControl, EventListenerCallBackFunction } from '../dist';

const kiirooKontrol: KiirooControl = new KiirooControl();

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const cb: EventListenerCallBackFunction = (
    x: number,
    y: number,
    z: number
  ): void => {
    const msg = `Device acceleration by axises x=${x}, y=${y}, z=${z}.`;
    console.log('msg:', msg);
    setLogs(prevLogs => [...prevLogs, msg]);
  };

  const deviceInfo = async (device: KiirooControl): Promise<void> => {
    let msg: string = 'Device: ';
    try {
      const deviceName = await device.getDeviceName();
      msg += `Device Name: ${deviceName}. `;

      const manufactureName = await device.getManufactureName();
      msg += `Manufacture Name: ${manufactureName}. `;

      const modelNumber = await device.getModelNumber();
      msg += `Model Number: ${modelNumber}. `;

      const hardwareVersion = await device.getHardwareVersion();
      msg += `Hardware Version: ${hardwareVersion}. `;

      const batteryLevel = await device.getBattery();
      setBatteryLevel(batteryLevel);
      msg += `battery level: ${batteryLevel}, `;

      const version = await device.getFirmwareVersion();
      setFirmwareVersion(version);
      msg += `firmware version: ${version}.`;
    } catch (ex) {
      msg = `Retrieving the device info: ${ex}`;
    }
    setLogs(prevLogs => [...prevLogs, msg]);
  };

  const handleConnect = async (device: KiirooControl) => {
    const options = KiirooControl.requestDeviceOptions;
    const btDevice = await navigator.bluetooth.requestDevice(options);
    try {
      await device.connect(btDevice);

      setIsConnected(true);
      setLogs(prevLogs => [
        ...prevLogs,
        `Connected to the device: ${btDevice.name}`,
      ]);

      await deviceInfo(device);
    } catch (e) {
      console.log('handleConnect:', e);
      setLogs(prevLogs => [...prevLogs, `Connected to the device error: ${e}`]);
    }
    device.setEventListenerCallBack(cb);
  };

  const handleTest = async (device: KiirooControl) => {
    const deviceStatus = device.isConnected();
    setLogs(prevLogs => [
      ...prevLogs,
      `Test command executed. Device connected: ${deviceStatus}`,
    ]);
    try {
      await device.testDevice();
    } catch (ex) {
      setLogs(prevLogs => [...prevLogs, `Device test: ${ex}`]);
    }
  };

  const handleDeviceInfo = async (device: KiirooControl) => {
    try {
      await deviceInfo(device);
    } catch (ex) {
      setLogs(prevLogs => [...prevLogs, ex]);
    }
  };

  const logProgress = () => {
    setLogs(prevLogs => [...prevLogs, 'Progressing: ']);
    let currPrc = 0;

    return (prc: number): void => {
      if (currPrc != prc) {
        currPrc = prc;
        setLogs(prevLogs => [...prevLogs, `${prc}%`]);
      }
    };
  };

  const handleUpdatingFirmwareVersion = async (device: KiirooControl) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogs(prevLogs => [...prevLogs, `Selected file: ${file.name}`]);

      const reader = new FileReader();
      reader.onload = async () => {
        const fileContent = reader.result as ArrayBuffer;
        setLogs(prevLogs => [...prevLogs, `Starting firmware update...`]);

        try {
          await kiirooKontrol.flashFirmware(fileContent, logProgress());
          setLogs(prevLogs => [...prevLogs, `Firmware updated successfully!`]);
        } catch (ex) {
          setLogs(prevLogs => [...prevLogs, `Firmware update failed: ${ex}`]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDisconnect = async (device: KiirooControl) => {
    if (device.isConnected()) {
      try {
        await device.disconnect();
      } catch (ex) {
        setLogs(prevLogs => [...prevLogs, `handle Disconnect: ${ex}`]);
      }
      setIsConnected(false);
      setLogs(prevLogs => [...prevLogs, 'Disconnected from the device']);
    }
    setBatteryLevel(null);
    setFirmwareVersion(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '50%', padding: '20px' }}>
        <h3>Status</h3>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>
          Battery Level: {batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
        </p>
        <p>Firmware Version: {firmwareVersion || 'N/A'}</p>

        <h3>Actions</h3>
        <p>
          <button
            onClick={() => {
              handleConnect(kiirooKontrol);
            }}
          >
            Connect
          </button>
        </p>
        <p>
          <button
            onClick={() => {
              handleTest(kiirooKontrol);
            }}
          >
            Test
          </button>
        </p>
        <p>
          <button
            onClick={() => {
              handleDeviceInfo(kiirooKontrol);
            }}
          >
            Get device info
          </button>
        </p>
        <p>
          <button
            onClick={() => {
              handleUpdatingFirmwareVersion(kiirooKontrol);
            }}
          >
            Firmware update via OTA
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </p>
        <p>
          <button
            onClick={() => {
              handleDisconnect(kiirooKontrol);
            }}
          >
            Disconnect
          </button>
        </p>
      </div>

      <div
        style={{
          width: '50%',
          padding: '20px',
          backgroundColor: '#f0f0f0',
        }}
      >
        <h3>Logs</h3>
        <div
          style={{
            maxHeight: '90%',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '10px',
          }}
        >
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default App;

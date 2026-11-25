import { useCallback, useEffect, useRef, useState } from 'react';

export type KavuReadings = {
  soilPercent: number;
  temperatureC: number;
  humidityPercent: number;
  pressureHpa: number;
  lightLux: number;
};

const ZERO: KavuReadings = { soilPercent: 0, temperatureC: 0, humidityPercent: 0, pressureHpa: 0, lightLux: 0 };
const SERVICE_UUID = '9a6f1000-7b3a-4e35-a3d2-55d91a4c1000';
const READINGS_UUID = '9a6f1001-7b3a-4e35-a3d2-55d91a4c1000';

function validNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function parseKavuReading(line: string): Partial<KavuReadings> | null {
  const text = line.trim();
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    const parsed: Partial<KavuReadings> = {};
    const fields: Array<[keyof KavuReadings, unknown]> = [
      ['soilPercent', data.soilPct ?? data.soilPercent],
      ['temperatureC', data.tempC ?? data.temperatureC],
      ['humidityPercent', data.humidityPct ?? data.humidityPercent],
      ['pressureHpa', data.pressureHpa],
      ['lightLux', data.lightLux ?? data.light],
    ];
    fields.forEach(([key, value]) => { const number = validNumber(value); if (number !== undefined) parsed[key] = number; });
    return Object.keys(parsed).length ? parsed : null;
  } catch { /* Accept the human-readable Serial Monitor line too. */ }

  const parsed: Partial<KavuReadings> = {};
  const patterns: Array<[keyof KavuReadings, RegExp]> = [
    ['temperatureC', /Temp:\s*(-?\d+(?:\.\d+)?)/i],
    ['humidityPercent', /Humidity:\s*(-?\d+(?:\.\d+)?)/i],
    ['pressureHpa', /Pressure:\s*(-?\d+(?:\.\d+)?)/i],
    ['lightLux', /Light:\s*(-?\d+(?:\.\d+)?)/i],
    ['soilPercent', /Soil:\s*(-?\d+(?:\.\d+)?)/i],
  ];
  patterns.forEach(([key, pattern]) => { const match = text.match(pattern); const number = validNumber(match?.[1]); if (number !== undefined) parsed[key] = number; });
  return Object.keys(parsed).length ? parsed : null;
}

export function useKavuSensors() {
  const [readings, setReadings] = useState<KavuReadings>(ZERO);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [transport, setTransport] = useState<'USB' | 'Bluetooth' | null>(null);
  const [hasReading, setHasReading] = useState(false);
  const [error, setError] = useState('');
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);
  const mountedRef = useRef(true);

  const reset = useCallback((nextStatus: 'disconnected' | 'error' = 'disconnected', message = '') => {
    if (!mountedRef.current) return;
    setReadings(ZERO);
    setHasReading(false);
    setTransport(null);
    setStatus(nextStatus);
    setError(message);
  }, []);

  const acceptLine = useCallback((line: string) => {
    const next = parseKavuReading(line);
    if (!next || !Object.keys(next).length || !mountedRef.current) return;
    setReadings(current => ({ ...current, ...next }));
    setHasReading(true);
    setError('');
  }, []);

  const connectUsb = useCallback(async () => {
    const serial = (navigator as any).serial;
    if (!serial?.requestPort) { reset('error', 'USB serial is unavailable in this browser. Use Chrome or Edge on a laptop.'); return; }
    setStatus('connecting'); setError('');
    let port: any;
    let reader: any;
    let intentionalClose = false;
    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
      reader = port.readable.getReader();
      const close = async () => {
        intentionalClose = true;
        try { await reader?.cancel(); } catch { /* already closed */ }
        try { reader?.releaseLock(); } catch { /* reader completed */ }
        try { await port?.close(); } catch { /* already closed */ }
      };
      cleanupRef.current = close;
      setReadings(ZERO); setHasReading(false); setTransport('USB'); setStatus('connected');
      void (async () => {
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const rows = buffer.split(/\r?\n/);
            buffer = rows.pop() ?? '';
            rows.forEach(acceptLine);
          }
        } catch { /* unplugged or user closed the port */ }
        finally {
          if (cleanupRef.current === close) {
            cleanupRef.current = null;
            try { reader.releaseLock(); } catch { /* already released */ }
            try { await port.close(); } catch { /* already closed */ }
            if (!intentionalClose) reset('disconnected');
          }
        }
      })();
    } catch (cause) {
      try { if (reader) await reader.cancel(); } catch { /* not opened */ }
      try { if (port?.readable?.locked) reader?.releaseLock(); } catch { /* not locked */ }
      try { await port?.close(); } catch { /* not opened */ }
      const message = (cause as Error)?.name === 'NotFoundError' ? 'No sensor was selected. Readings remain at 0.' : 'Could not open the USB sensor. Check the cable and try again.';
      reset('error', message);
    }
  }, [acceptLine, reset]);

  const connectBluetooth = useCallback(async () => {
    const bluetooth = (navigator as any).bluetooth;
    if (!bluetooth?.requestDevice) { reset('error', 'Bluetooth sensor access needs Chrome on Android over HTTPS.'); return; }
    setStatus('connecting'); setError('');
    try {
      const device = await bluetooth.requestDevice({ filters: [{ name: 'Kavu-Sensor' }], optionalServices: [SERVICE_UUID] });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(READINGS_UUID);
      const onData = (event: any) => {
        const value: DataView = event.target.value;
        acceptLine(new TextDecoder().decode(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)));
      };
      const onDisconnect = () => {
        if (cleanupRef.current === close) cleanupRef.current = null;
        reset('disconnected');
      };
      const close = async () => {
        characteristic.removeEventListener('characteristicvaluechanged', onData);
        device.removeEventListener('gattserverdisconnected', onDisconnect);
        if (device.gatt?.connected) device.gatt.disconnect();
      };
      cleanupRef.current = close;
      device.addEventListener('gattserverdisconnected', onDisconnect);
      characteristic.addEventListener('characteristicvaluechanged', onData);
      await characteristic.startNotifications();
      setReadings(ZERO); setHasReading(false); setTransport('Bluetooth'); setStatus('connected');
    } catch (cause) {
      const message = (cause as Error)?.name === 'NotFoundError' ? 'No Kāvu sensor was selected. Readings remain at 0.' : 'Could not connect to Kāvu over Bluetooth. Try again nearby.';
      reset('error', message);
    }
  }, [acceptLine, reset]);

  const disconnect = useCallback(async () => {
    const close = cleanupRef.current;
    cleanupRef.current = null;
    try { await close?.(); } finally { reset(); }
  }, [reset]);

  useEffect(() => () => {
    mountedRef.current = false;
    const close = cleanupRef.current;
    cleanupRef.current = null;
    void close?.();
  }, []);

  return { readings, status, transport, hasReading, error, connectUsb, connectBluetooth, disconnect };
}

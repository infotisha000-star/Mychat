import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Camera, AlertCircle, RefreshCw, Upload, Sparkles } from 'lucide-react';
import { playReceiveSound } from '../../utils/soundEffects';

export const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [scannerError, setScannerError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const stopScannerSafely = async () => {
    if (scannerRef.current) {
      const scannerInstance = scannerRef.current;
      scannerRef.current = null;
      try {
        await scannerInstance.stop();
      } catch (e) {}
      try {
        scannerInstance.clear();
      } catch (e) {}
    }
  };

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (isOpen) {
      setScannerError('');
      setIsScanning(true);

      const regionId = 'qr-reader-container';

      // Short delay to ensure DOM element exists inside Modal
      const timer = setTimeout(() => {
        try {
          html5QrcodeScanner = new Html5Qrcode(regionId);
          scannerRef.current = html5QrcodeScanner;

          const config = { fps: 10, qrbox: { width: 220, height: 220 } };

          html5QrcodeScanner
            .start(
              { facingMode: 'environment' },
              config,
              async (decodedText) => {
                // Success callback
                try {
                  playReceiveSound();
                } catch (e) {}

                await stopScannerSafely();
                setIsScanning(false);

                // Clean extracted code
                let cleanText = decodedText.trim();
                if (cleanText.includes('code=')) {
                  cleanText = cleanText.split('code=')[1].split('&')[0];
                }
                cleanText = cleanText.toUpperCase();

                onScanSuccess(cleanText);
                onClose();
              },
              (errorMessage) => {
                // Silent frame warning
              }
            )
            .catch((err) => {
              console.warn('Camera start error:', err);
              setIsScanning(false);
              setScannerError('Camera access denied or unsupported on this device. You can type the access code manually.');
            });
        } catch (e) {
          console.error('Html5Qrcode init error:', e);
          setIsScanning(false);
          setScannerError('Could not initialize camera scanner. Please grant camera permission.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        stopScannerSafely();
      };
    }
  }, [isOpen, onClose, onScanSuccess]);

  const handleClose = async () => {
    await stopScannerSafely();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan Access Code QR Code">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Banner Guidance */}
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl w-full justify-center">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Point Camera at QR Code for Auto-Login</span>
        </div>

        {/* Live Camera Scanner Box */}
        <div className="relative w-full max-w-[280px] h-[280px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />

          {/* Frame Finder Overlay Graphic */}
          {isScanning && !scannerError && (
            <div className="pointer-events-none absolute inset-0 border-[3px] border-cyan-400/40 rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-cyan-400 rounded-xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-300 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-300 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-300 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-300 -mb-1 -mr-1" />
              </div>
            </div>
          )}
        </div>

        {/* Error Message & Permission Guide */}
        {scannerError ? (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-medium leading-relaxed flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{scannerError}</span>
          </div>
        ) : (
          <p className="text-xs text-slate-400 max-w-xs">
            Position the access code QR code inside the frame. Code will be detected and logged in automatically!
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleClose}
          className="w-full mt-1"
        >
          Cancel & Enter Code Manually
        </Button>
      </div>
    </Modal>
  );
};

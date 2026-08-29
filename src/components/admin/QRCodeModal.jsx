import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Copy, Download, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';

export const QRCodeModal = ({ isOpen, onClose, code }) => {
  const canvasRef = useRef(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (isOpen && code && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        code,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) {
            console.error('QR code generation error:', err);
          } else if (canvasRef.current) {
            setDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [isOpen, code]);

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      toast.success(`Access code ${code} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy code to clipboard.');
    }
  };

  const handleDownloadQR = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `VORTEX_QR_${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code image downloaded!');
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Code QR Code">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center">
          <canvas ref={canvasRef} className="w-56 h-56 rounded-xl" />
        </div>

        <div className="flex flex-col gap-1 items-center">
          <span className="text-xs text-slate-400 font-medium">Access Code</span>
          <span className="font-mono text-xl font-bold tracking-wider text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
            {code}
          </span>
        </div>

        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Users can scan this QR code using their device camera on the login screen for instant auto-login.
        </p>

        <div className="grid grid-cols-2 gap-2 w-full pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React from 'react';
import { FileText, Download, FileArchive, FileSpreadsheet, FileCode, File } from 'lucide-react';

export const DocumentAttachment = ({ fileUrl = '', fileName = 'Attachment', fileSize = '', isMe = false }) => {
  const getFileIcon = (name) => {
    const ext = name?.split('.')?.pop()?.toLowerCase();
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-400" />;
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'json', 'py', 'cpp'].includes(ext)) return <FileCode className="w-5 h-5 text-cyan-400" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText className="w-5 h-5 text-indigo-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      onClick={handleDownload}
      className={`flex items-center gap-3 p-3 rounded-2xl border my-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
        isMe
          ? 'bg-black/20 border-white/20 text-white hover:bg-black/30'
          : 'bg-slate-800/90 border-slate-700 text-slate-100 hover:bg-slate-800'
      } max-w-xs`}
    >
      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 shrink-0">
        {getFileIcon(fileName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs truncate" title={fileName}>
          {fileName}
        </div>
        {fileSize && (
          <div className="text-[10px] opacity-75 font-mono">
            {fileSize}
          </div>
        )}
      </div>

      <div className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white shrink-0 shadow-sm">
        <Download className="w-4 h-4" />
      </div>
    </div>
  );
};

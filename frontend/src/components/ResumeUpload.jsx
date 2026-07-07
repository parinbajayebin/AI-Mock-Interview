import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ResumeUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { token } = useAuth();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to upload resume.');
      }

      const result = await res.json();
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-signal-lg flex flex-col">
      <h3 className="font-display font-semibold text-primary mb-3.5 flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-accent" />
        <span>Upload Resume</span>
      </h3>

      <div
        className={`flex-1 border-2 border-dashed rounded-signal-md p-6 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging 
            ? 'border-accent bg-accent/5 shadow-inner' 
            : 'border-border bg-white/10 hover:border-accent/40 hover:bg-white/20'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`w-9 h-9 mb-2.5 transition-colors ${isDragging ? 'text-accent' : 'text-secondary/60'}`} />
        <p className="text-primary font-bold text-[13px] text-center">Drag & drop resume PDF here</p>
        <p className="text-secondary text-[11px] mb-4 text-center">or browse from your device</p>
        <button
          onClick={() => fileInputRef.current.click()}
          className="btn-secondary text-[12px] py-1.5 px-3"
          disabled={isUploading}
        >
          Select File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50/50 backdrop-blur-md border border-red-200 rounded-signal-md flex items-start gap-2.5 animate-scale-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {file && (
        <div className="mt-4 p-3 bg-white/30 backdrop-blur-md rounded-signal-md border border-white/40 flex items-center justify-between shadow-sm animate-scale-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-primary truncate max-w-[130px]">
                {file.name}
              </p>
              <p className="text-[10px] text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFile(null)}
              className="p-1.5 hover:bg-base rounded-full text-secondary hover:text-primary transition-colors"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary text-[11px] py-1.5 px-2.5 flex items-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Uploading</span>
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

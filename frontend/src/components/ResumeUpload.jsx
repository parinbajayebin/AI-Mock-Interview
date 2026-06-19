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
    <div className="glass-panel p-8 rounded-2xl border border-slate-800 h-full flex flex-col">
      <div
        className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
          isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-900/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-violet-400' : 'text-slate-500'}`} />
        <p className="text-slate-300 font-medium mb-2 text-center">Drag and drop your resume PDF here</p>
        <p className="text-slate-500 text-xs mb-6 text-center">or click to browse from your computer</p>
        <button
          onClick={() => fileInputRef.current.click()}
          className="btn-primary text-sm"
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
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {file && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-violet-400" />
            <div>
              <p className="text-sm font-medium text-slate-200 truncate max-w-[150px]">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary text-xs py-1.5 px-3 flex items-center"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Uploading...
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

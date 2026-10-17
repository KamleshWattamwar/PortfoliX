import React, { useState } from 'react';
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CsvUploadModal({ isOpen, onClose, onImportCsv, loading }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please drop a valid .csv file.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setError('');
    setResult(null);

    try {
      const res = await onImportCsv(file);
      setResult(res);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to import CSV.');
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "Symbol,Quantity,Average Price,Buy Date\nRELIANCE,25,2750.00,2024-01-15\nTCS,20,3900.00,2024-01-20\nINFY,40,1780.00,2024-02-01\nHDFCBANK,50,1650.00,2024-02-10\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'portfolix_holdings_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Import Broker CSV</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          
          {/* Format helper box */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                Expected CSV Format:
              </span>
              <button 
                type="button" 
                onClick={downloadSampleCsv} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
              >
                <Download size={13} />
                Download Sample
              </button>
            </div>
            <div className="mono-text" style={{ fontSize: '0.88rem', color: '#2563eb', fontWeight: 600, background: '#eff6ff', border: '1px solid #dbeafe', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
              Symbol, Quantity, Average Price
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Works with standard exports from Zerodha, Upstox, Groww, Angel One, and custom spreadsheets.
            </div>
          </div>

          {error && (
            <div className="badge badge-negative" style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '0.88rem' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {result && (
            <div className="badge badge-positive" style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>{result.message}</span>
              </div>
              {result.errors?.length > 0 && (
                <div style={{ fontSize: '0.82rem', color: '#dc2626' }}>
                  {result.errors.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Drag & drop area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '14px',
              padding: '2.4rem 1.75rem',
              textAlign: 'center',
              background: dragActive ? '#eff6ff' : '#f8fafc',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('csv-file-input').click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <FileText size={40} color={file ? '#2563eb' : '#64748b'} style={{ margin: '0 auto 0.85rem auto' }} />
            
            {file ? (
              <div>
                <div className="mono-text" style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {(file.size / 1024).toFixed(1)} KB • Click to change file
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.02rem', fontWeight: '600', color: '#0f172a' }}>
                  Drag & drop your CSV file here
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                  or click anywhere to browse from your device
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {result ? 'Done' : 'Cancel'}
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? 'Importing Positions...' : 'Import CSV'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

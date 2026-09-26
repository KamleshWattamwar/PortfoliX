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
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={18} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Import Broker CSV</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Format helper box */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.9rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Expected CSV Format:
              </span>
              <button 
                type="button" 
                onClick={downloadSampleCsv} 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                <Download size={12} />
                Download Sample
              </button>
            </div>
            <div className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: '#0a0d14', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              Symbol, Quantity, Average Price
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Works with standard exports from Zerodha, Upstox, Groww, and manual spreadsheets.
            </div>
          </div>

          {error && (
            <div className="badge badge-negative" style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {result && (
            <div className="badge badge-positive" style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>{result.message}</span>
              </div>
              {result.errors?.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
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
              border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              background: dragActive ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
              transition: 'all 0.2s ease',
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
            <FileText size={36} color={file ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ margin: '0 auto 0.75rem auto' }} />
            
            {file ? (
              <div>
                <div className="mono-text" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {(file.size / 1024).toFixed(1)} KB • Click to change
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Drag & drop your CSV file here
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  or browse from your device
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

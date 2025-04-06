import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import styles from './Scanner.module.css';
import scanResults from '../data/scan-results.json';

interface ScanResults {
  Title: string;
  Results: {
    "[Good]": string[];
    "[Bad]": string[];
    "[Rgpd]": string;
  }
}

export function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);

  const scanPage = async () => {
    setScanning(true);
    setShowSidePanel(true);
    
    // Simulate API call with our JSON data
    setTimeout(() => {
      setResults(scanResults as ScanResults);
      setScanning(false);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', right: '20px', top: '20px' }}>
      <button
        onClick={scanPage}
        disabled={scanning}
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: '#4A4F51',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          borderRadius: '8px'
        }}
      >
        <Scan size={20} color="white" />
      </button>
      
      {/* Side Panel */}
      <div 
        className={`${styles.sidePanel} ${showSidePanel ? styles.sidePanelOpen : ''}`}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '400px',
          backgroundColor: '#0f0f11',
          transform: showSidePanel ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
          zIndex: 1000,
          padding: '16px',
          opacity: showSidePanel ? 1 : 0,
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '12px'
        }}>
          <h2 style={{ color: '#f5f5f7', margin: 0, fontSize: '1.5em', fontWeight: 'bold' }}>
            Privacy Scanner Results
          </h2>
          <button
            onClick={() => setShowSidePanel(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0b2',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {results && (
          <div style={{ color: '#f5f5f7' }}>
            {/* Good Section */}
            <div style={{ 
              background: 'rgba(46, 204, 113, 0.1)', 
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                color: '#2ecc71', 
                marginBottom: '16px', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2em' }}>✅</span> Good Points
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {results.Results["[Good]"].map((point, index) => (
                  <li key={index} style={{ 
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ color: '#2ecc71', flexShrink: 0 }}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bad Section */}
            <div style={{ 
              background: 'rgba(231, 76, 60, 0.1)', 
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                color: '#e74c3c', 
                marginBottom: '16px', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2em' }}>❌</span> Issues Found
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {results.Results["[Bad]"].map((point, index) => (
                  <li key={index} style={{ 
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ color: '#e74c3c', flexShrink: 0 }}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RGPD Section */}
            <div style={{ 
              background: 'rgba(52, 152, 219, 0.1)', 
              borderRadius: '16px',
              padding: '16px'
            }}>
              <h3 style={{ 
                color: '#3498db', 
                marginBottom: '16px', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2em' }}>🔵</span> RGPD Compliance
              </h3>
              <p style={{ margin: 0, lineHeight: '1.5' }}>{results.Results["[Rgpd]"]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
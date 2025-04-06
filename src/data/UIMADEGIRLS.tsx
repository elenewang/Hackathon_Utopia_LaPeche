import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import styles from './Scanner.module.css';
import scanResults from '../data/scan-results.json';



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
        className={styles.scanButton}
      >
        <Scan size={20} color="white" />
      </button>
      
      {/* Side Panel */}
      <div 
        className={`${styles.sidePanel} ${showSidePanel ? styles.sidePanelOpen : ''}`}
      >
        <div className={styles.sidePanelHeader}>
          <h2>Privacy Scanner Results</h2>
          <button
            onClick={() => setShowSidePanel(false)}
            className={styles.closeButton}
          >
            <X size={20} />
          </button>
        </div>

        {results && (
          <div style={{ color: '#f5f5f7' }}>
            {/* Good Section */}
            <div className={styles.section + " " + styles.goodPoints}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>✅</span> Good Points
              </h3>
              <ul className={styles.list}>
                {results.Results["[Good]"].map((point, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={styles.bullet}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bad Section */}
            <div className={styles.section + " " + styles.issuesFound}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>❌</span> Issues Found
              </h3>
              <ul className={styles.list}>
                {results.Results["[Bad]"].map((point, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={`${styles.bullet} ${styles.red}`}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RGPD Section */}
            <div className={styles.section + " " + styles.rgpdCompliance}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>🔵</span> RGPD Compliance
              </h3>
              <p>{results.Results["[Rgpd]"]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

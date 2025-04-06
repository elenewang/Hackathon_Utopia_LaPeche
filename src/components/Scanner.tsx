import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import styles from './Scanner.module.css';
import { processURL } from './Extractor'; 
import { scanText } from '../services/langflow-api';
import { ScanResponse } from '../services/response-model';
import scanResults from '../data/scan-results.json';

type LinkType = { url: string; text: string };

type ScannerProps = {
  links?: LinkType[];
};


export function Scanner({ links }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{ text: string } | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanPage = async () => {
    console.log('Scan initiated');
    setShowSidePanel(true);
    setScanning(true);
    setError(null);

    try {
      let concatenatedText = '';

      // Loop over all links and extract terms from each URL
      for (const link of links ?? []) {
        const extractionResult = await processURL(link.url);
        concatenatedText += extractionResult.rawText + "\n"; // Concatenate extracted text with newline separation
      }

      console.log('Concatenated Extracted Text:', concatenatedText);

      const apiResult: ScanResponse = await scanText(concatenatedText);
      console.log('API Response:', apiResult);

      //setResults({ text: concatenatedText });
      setResults(scanResults as any);
    } catch (error) {
      console.error('Error scanning page:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
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
                {/* {results.Results["[Good]"].map((point, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={styles.bullet}>•</span>
                    <span>{point}</span>
                  </li>
                ))} */}
              </ul>
            </div>

            {/* Bad Section */}
            <div className={styles.section + " " + styles.issuesFound}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>❌</span> Issues Found
              </h3>
              <ul className={styles.list}>
                {/* {(results as any).Results["[Bad]"].map((point, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={`${styles.bullet} ${styles.red}`}>•</span>
                    <span>{point}</span>
                  </li>
                ))} */}
              </ul>
            </div>

            {/* RGPD Section */}
            <div className={styles.section + " " + styles.rgpdCompliance}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>🔵</span> RGPD Compliance
              </h3>
              <p>{(results as any).Results["[Rgpd]"]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

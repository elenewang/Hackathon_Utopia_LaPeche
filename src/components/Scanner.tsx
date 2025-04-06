import { useState } from 'react';
import { Scan } from 'lucide-react';
import styles from './Scanner.module.css';
import { processURL } from './Extractor'; 
// import { scanText } from '../services/langflow-api';
// import { ScanResponse } from '../services/response-model';

type LinkType = { url: string; text: string };

type ScannerProps = {
  links?: LinkType[];
};


export function Scanner({ links }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{ text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scanPage = async () => {
    console.log('Scan initiated');
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

      // Call your API with the concatenated text scans
      const response = await fetch('https://example.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: concatenatedText }),
      });

      const apiResult = await response.json();
      console.log('API Response:', apiResult);

      setResults({ text: concatenatedText });
    } catch (error) {
      console.error('Error scanning page:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Policy Scanner</h2>
        <button onClick={scanPage} disabled={scanning} className={styles.button}>
          <Scan size={20} />
          {scanning ? 'Scanning...' : 'Scan Page'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <p>Error: {error}</p>
        </div>
      )}

      {results && (
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>Analysis Results:</h3>
          <pre className={styles.resultsContent}>
            {results.text}
          </pre>
        </div>
      )}
    </div>
  );
}

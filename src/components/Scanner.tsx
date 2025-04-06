import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import styles from './Scanner.module.css';
import { processURL } from './Extractor'; 
import { scanText } from '../services/langflow-api';
import { ScanResponse } from '../services/response-model';
import scanResults from '../data/scan-results.json';
import { chunkText } from './Chunktxt';
import { callMistral } from './callLLM_API';


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

      //console.log('Concatenated Extracted Text:', concatenatedText);

      const apiResult: ScanResponse = await scanText(concatenatedText, extractDomain(window.location.href) || '');
      console.log('API Response:', apiResult);

      // 2) Chunk the text
      const chunkSize = 300000; // Adjust based on your LLM's token limit
      const chunks = chunkText(concatenatedText, chunkSize);

      // 3) Summarize each chunk (example)
      const summaries: string[] = [];
      for (const chunk of chunks) {
        const prompt = `Summarize the following text, keeping the keys informations concerning the user rights:\n\n${chunk}\n\nSummary:`;
        const summary = await callMistral(prompt);
        summaries.push(summary);
      }


      // 4) Combine or process further
      const combinedSummary = summaries.join('\n\n');
      console.log('Final Combined Summary:', combinedSummary);

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

function extractDomain(url: string | null | undefined): string | null {
  // Return null if the input is null or undefined
  if (url == null) {
    return null;
  }

  try {
    // Remove protocol (http://, https://, etc.)
    let domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
    
    // Match the domain up to the TLD (.com, .org, etc.)
    const domainMatch = domain.match(/^([^\/\?:#]+)(?:[\/\?:#]|$)/);
    
    if (domainMatch && domainMatch[1]) {
      return domainMatch[1];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
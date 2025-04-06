import { useState } from 'react';
import { Scan, X } from 'lucide-react';
import styles from './Scanner.module.css';
import { processURL } from './Extractor';
import { scanText } from '../services/langflow-api';
import { ScanResponse } from '../services/response-model';
import { chunkText } from './Chunktxt';
import { callMistral } from '../services/mistral-api';

type LinkType = { url: string; text: string };

type ScannerProps = {
  links?: LinkType[];
};

interface ParsedData {
  good: string[];
  bad: string[];
}

export function Scanner({ links }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ParsedData>({ good: [], bad: [] });
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanPage = async () => {
    console.log('Scan initiated');
    setShowSidePanel(true);
    setScanning(true);
    setError(null);
    // Reset results to empty arrays when starting a new scan
    setResults({ good: [], bad: [] });

    try {
      let concatenatedText = '';

      // Loop over all links and extract terms from each URL
      for (const link of links ?? []) {
        const extractionResult = await processURL(link.url);
        concatenatedText += extractionResult.rawText + "\n"; // Concatenate extracted text with newline separation
      }

      //console.log('Concatenated Extracted Text:', concatenatedText);

      // 2) Chunk the text
      const chunkSize = 100000; // Adjust based on your LLM's token limit
      const chunks = chunkText(concatenatedText, chunkSize);

      // 3) Summarize each chunk
      const summaries: string[] = [];
      for (const chunk of chunks) {
        const prompt = `Summarize the following text by focusing only on the key information related to user rights (e.g., data usage, account ownership, cancellation, refunds, responsibilities, and any restrictions). Ignore legal boilerplate or irrelevant administrative details. The goal is to condense the content for a later API call. Text:\n${chunk}\nSummary (User Rights Focused):`;
        const summary = await callMistral(prompt);
        summaries.push(summary);
        console.log('Summary:', summary);
      }

      // 4) Combine or process further
      const combinedSummary = summaries.join('\n\n');
      //console.log('Final Combined Summary:', combinedSummary);

      const apiResult: ScanResponse = await scanText(combinedSummary, extractDomain(window.location.href) || '');
      console.log('API Response:', apiResult);

      // Parse the response before updating state
      const parsedResults = parseAndSeparateAnswers(apiResult.data.outputs[0].outputs[0].outputs.text.message);
      console.log('Parsed Results:', parsedResults);
      
      // Update state with the parsed results
      setResults(parsedResults);
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

        {/* Conditionally render the results sections */}
        {!scanning && (
          <div style={{ color: '#f5f5f7' }}>
            {/* Good Section */}
            <div className={styles.section + " " + styles.goodPoints}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>✅</span> Good Points
              </h3>
              <ul className={styles.list}>
                {results.good.length > 0 ? (
                  results.good.map((point, index) => (
                    <li key={index} className={styles.listItem}>
                      <span className={styles.bullet}>•</span>
                      <span>{point}</span>
                    </li>
                  ))
                ) : (
                  <li className={styles.listItem}>No good points found</li>
                )}
              </ul>
            </div>

            {/* Bad Section */}
            <div className={styles.section + " " + styles.issuesFound}>
              <h3>
                <span style={{ fontSize: '1.2em' }}>❌</span> Issues Found
              </h3>
              <ul className={styles.list}>
                {results.bad.length > 0 ? (
                  results.bad.map((point, index) => (
                    <li key={index} className={styles.listItem}>
                      <span className={`${styles.bullet} ${styles.red}`}>•</span>
                      <span>{point}</span>
                    </li>
                  ))
                ) : (
                  <li className={styles.listItem}>No issues found</li>
                )}
              </ul>
            </div>
          </div>
        )}
        {/* Optionally display a loading indicator or message while scanning */}
        {scanning && <p style={{ color: '#f5f5f7' }}>Scanning...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    </div>
  );
}

const capitalizeFirstLetter = (text: string): string => {
  if (!text || text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Your parsing function
function parseAndSeparateAnswers(input: string): ParsedData {
  try {
    // Clean up the input string and parse it
    const cleanedInput = input.replace(/,\"$/, '');
    const parsedData = JSON.parse(cleanedInput);

    const good: string[] = [];
    const bad: string[] = [];

    for (const answer of Object.values(parsedData)) {
      const answerStr = answer as string;

      if (answerStr.startsWith("Good, ")) {
        const cleanedAnswer = answerStr.substring(6);
        good.push(capitalizeFirstLetter(cleanedAnswer));
      } else if (answerStr.startsWith("Bad, ")) {
        const cleanedAnswer = answerStr.substring(5);
        bad.push(capitalizeFirstLetter(cleanedAnswer));
      }
    }

    return { good, bad };
  } catch (error) {
    console.error("Error processing message:", error);
    return { good: [], bad: [] };
  }
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
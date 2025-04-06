import { ExtractionResult } from './extractor-result-model';
// Import pdfjsLib if using pdf.js (ensure it is installed and configured)
import * as pdfjsLib from 'pdfjs-dist';
// Optionally configure the worker if needed
// pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/pdf.worker.js';

/**
 ** Terms and Conditions Extractor for Chrome Extension (with URL support)
 ** With timeout handling
 **/

// Helper function to process raw text and extract terms
function processRawText(rawText: string, sourceTitle: string = ''): ExtractionResult {
  // Remove excessive whitespace and URLs
  const cleanedText = rawText
    .replace(/\s+/g, ' ')
    .replace(/https?:\/\/[^\s]+/g, '[URL]');
    
  // 1. Attempt to identify the beginning and end of the actual terms
  const startIndicators: string[] = [
    'Terms and Conditions', 'Terms of Service', 'Terms of Use',
    'User Agreement', 'Legal Terms', 'TERMS AND CONDITIONS',
    'TERMS OF SERVICE', 'TERMS OF USE'
  ];
  
  const endIndicators: string[] = [
    'Last updated', 'Last modified', 'Effective date',
    'Contact Us', 'Questions or concerns', 'How to contact us'
  ];
  
  let startIndex = 0;
  for (const indicator of startIndicators) {
    const index = cleanedText.indexOf(indicator);
    if (index !== -1) {
      startIndex = index;
      break;
    }
  }
  
  let endIndex = cleanedText.length;
  for (const indicator of endIndicators) {
    const index = cleanedText.lastIndexOf(indicator);
    if (index !== -1 && index > startIndex) {
      endIndex = index;
      break;
    }
  }
  
  const termsText = cleanedText.substring(startIndex, endIndex).trim();
  
  // 2. Structure the content by identifying sections (using simple heading detection)
  const sections: { title: string; content: string }[] = [];
  const sectionHeadings: string[] = [
    'Introduction', 'Definitions', 'Account', 'User', 'Privacy', 'Content',
    'Restrictions', 'Copyright', 'Intellectual Property', 'Termination',
    'Limitation', 'Disclaimer', 'Governing Law', 'Changes', 'Contact'
  ];
  
  let currentSection = { title: 'General', content: '' };
  const paragraphs = termsText.split(/\n+/);
  
  for (const paragraph of paragraphs) {
    const isHeading = sectionHeadings.some(heading => 
      paragraph.includes(heading) && paragraph.length < 100
    );
    if (isHeading) {
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = { title: paragraph.trim(), content: '' };
    } else {
      currentSection.content += paragraph + '\n\n';
    }
  }
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return {
    success: true,
    rawText: termsText,
    formattedSections: sections,
    url: '',
    title: sourceTitle,
    extractedFrom: '',
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract terms and conditions from a given URL.
 * If the URL points to a PDF, the PDF text is extracted.
 * If the URL points to an HTML document, the HTML is parsed and processed.
 */
export async function extractTermsAndConditionsFromUrl(url: string, timeoutMs: number = 5000): Promise<ExtractionResult> {
  return new Promise<ExtractionResult>(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({
        success: false,
        message: `Extraction timed out after ${timeoutMs}ms`
      });
    }, timeoutMs);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        clearTimeout(timeoutId);
        return resolve({
          success: false,
          rawText: '',
          message: `Failed to fetch URL: ${response.statusText}`
        });
      }

      const contentType = response.headers.get("content-type") || "";
      let rawText = '';
      let sourceTitle = '';
      let extractedFrom = '';

      if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
        // --- Process PDF ---
        const arrayBuffer = await response.arrayBuffer();
        // Load the PDF document using pdf.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let pdfText = '';
        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // Combine text items from the page
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          pdfText += pageText + '\n';
        }
        rawText = pdfText;
        extractedFrom = 'PDF';
      } else {
        // --- Process HTML ---
        const htmlString = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        sourceTitle = doc.title;
        extractedFrom = 'HTML';

        // Clone the entire body to ensure all page content is scraped
        const contentClone = doc.body.cloneNode(true) as HTMLElement;

        // Remove unwanted elements (e.g., header, footer, ads, etc.)
        const elementsToRemove: string[] = [
          'header', 'footer', 'nav', '.nav', '#nav', '.navigation', '#navigation',
          '.menu', '#menu', '.sidebar', '#sidebar', 'aside',
          '.ad', '.ads', '.advertisement', '.cookie-banner', '.cookie-notice',
          '.newsletter', '.subscribe', '.social-media', '.social-links',
          '.comment', '.comments', 'iframe', 'script', 'style'
        ];
        elementsToRemove.forEach(selector => {
          contentClone.querySelectorAll(selector).forEach(el => el.remove());
        });

        rawText = contentClone.textContent?.trim() || '';
      }

      // Process the raw text to extract the relevant terms content
      const extractionResult = processRawText(rawText, sourceTitle);
      extractionResult.url = url;
      extractionResult.extractedFrom = extractedFrom;
      
      clearTimeout(timeoutId);
      resolve(extractionResult);
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        rawText: '',
        message: "Error extracting terms and conditions",
        error: error
      });
    }
  });
}

/**
 * Optionally, you can provide a wrapper function to analyze the terms.
 */
export async function analyzeTermsAndConditionsFromUrl(url: string, timeoutMs: number = 5000) {
  try {
    const extractedTerms = await extractTermsAndConditionsFromUrl(url, timeoutMs);
    return extractedTerms;
  } catch (error) {
    return {
      success: false,
      message: "Error analyzing terms and conditions",
      error: error
    };
  }
}

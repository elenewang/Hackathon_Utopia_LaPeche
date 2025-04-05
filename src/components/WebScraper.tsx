import { ExtractionResult } from './extractor-result-model';
import * as pdfjs from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

/**
 ** Terms and Conditions Extractor for Chrome Extension
 ** With URL handling and PDF processing using pdfjs-dist
 **/

// Function to extract the terms and conditions content with timeout
export async function extractTermsAndConditions(url: string, timeoutMs: number = 5000): Promise<any> {
  return new Promise(async (resolve, reject) => {
    // Set timeout for the entire extraction process
    const timeoutId = setTimeout(() => {
      reject({
        success: false,
        message: `Extraction timed out after ${timeoutMs}ms`
      });
    }, timeoutMs);

    try {
      // Check if the URL is a PDF
      if (isPdfUrl(url)) {
        // Handle PDF URL directly
        const pdfData = await extractPdfContent(url);
        const savedPdfLink = await savePdf(url, pdfData);
        
        clearTimeout(timeoutId);
        resolve({
          success: true,
          pdfLink: savedPdfLink,
          pdfText: pdfData.text,
          sourceUrl: url,
          isPdf: true
        });
        return;
      }

      // If not a PDF, fetch the HTML and extract content
      const termsData = await extractHtmlContent(url);
      
      // Convert HTML content to PDF
      const pdfBlob = await htmlToPdf(termsData.text, termsData.title || 'Terms and Conditions');
      const savedPdfLink = await saveBlobAsPdf(pdfBlob, sanitizeFilename(termsData.title || 'terms'));
      
      const result = {
        success: true,
        pdfLink: savedPdfLink,
        sourceUrl: url,
        rawText: termsData.text,
        title: termsData.title,
        isPdf: false
      };
      
      // Clear the timeout and resolve
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        message: "Error processing content",
        error: error,
        sourceUrl: url
      });
    }
  });
}

// Helper function to check if URL is a PDF
function isPdfUrl(url: string): boolean {
  return (
    url.toLowerCase().endsWith('.pdf') || 
    url.toLowerCase().includes('/pdf/') || 
    url.toLowerCase().includes('application/pdf') ||
    url.toLowerCase().includes('content-type=pdf')
  );
}

// Function to sanitize filename
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
}

// Function to extract content from a PDF URL using pdfjs-dist
async function extractPdfContent(url: string): Promise<{ text: string, metadata?: any }> {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(url);
    const pdf = await loadingTask.promise;

    // Get metadata
    const metadata = await pdf.getMetadata().catch(() => ({}));

    // Extract text from all pages
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }

    return {
      text: fullText.trim(),
      metadata
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw error;
  }
}

// Function to extract content from HTML page
async function extractHtmlContent(url: string): Promise<{
  text: string;
  title: string;
}> {
  // For Chrome extensions, this function would navigate to the page
  // and extract content from the DOM directly
  
  // For demonstration purposes, we'll simulate that extraction here
  // In a real extension, this would run in a content script

  // 1. Try to identify the main content area using common selectors
  const potentialSelectors: string[] = [
    // Common containers for terms/legal content
    'main', 'article', '.content', '#content', '.main-content', '#main-content',
    '.terms', '#terms', '.terms-content', '#terms-content',
    '.legal', '#legal', '.legal-content', '#legal-content',
    '.terms-and-conditions', '#terms-and-conditions',
    '.tos', '#tos', '.terms-of-service', '#terms-of-service',
    '[aria-label*="terms"]', '[aria-label*="Terms"]',
    // Fallback to body if needed
    'body'
  ];
  
  let mainContent: Element | null = null;
  
  // Try each selector until we find content
  for (const selector of potentialSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent) {
      // Check if this element contains enough text to likely be the terms
      const text = element.textContent.trim();
      if (text.length > 500) {    // Minimum expected length for terms content
        mainContent = element;
        break;
      }
    }
  }
  
  if (!mainContent) {
    throw new Error("Could not identify terms content container");
  }

  // 2. Clean up the content by removing unnecessary elements
  // Create a clone to avoid modifying the actual DOM
  const contentClone = mainContent.cloneNode(true) as HTMLElement;
  
  const elementsToRemove: string[] = [
    'header', 'footer', 'nav', '.nav', '#nav', '.navigation', '#navigation',
    '.menu', '#menu', '.sidebar', '#sidebar', 'aside',
    '.ad', '.ads', '.advertisement', '.cookie-banner', '.cookie-notice',
    '.newsletter', '.subscribe', '.social-media', '.social-links',
    '.comment', '.comments', 'iframe', 'script', 'style'
  ];
  
  // Remove elements from the clone
  elementsToRemove.forEach(selector => {
    contentClone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // 3. Extract and clean the text content
  let termsText: string = contentClone.textContent?.trim()
    // Remove excessive whitespace
    .replace(/\s+/g, ' ') || '';
  
  return {
    text: termsText,
    title: document.title || 'Terms and Conditions'
  };
}

// Function to convert HTML content to PDF using jsPDF (would need to be installed)
async function htmlToPdf(content: string, title: string): Promise<Blob> {
  // Note: In a real implementation, you would use jsPDF or another library
  // For demonstration, we're creating a simple text-based PDF
  
  // This is where you'd implement actual PDF creation
  // For demonstration purposes, we're creating a simple Blob
  const pdfContent = `
    ${title}
    
    ${content}
  `;
  
  // In a real implementation, you would do:
  // const doc = new jsPDF();
  // doc.text(content, 10, 10);
  // return doc.output('blob');
  
  // For now, we're just returning a text blob as placeholder
  return new Blob([pdfContent], { type: 'application/pdf' });
}

// Function to save a PDF from a URL
async function savePdf(url: string, pdfData: any): Promise<string> {
  // Get filename from URL or generate one
  const filename = getPdfFilenameFromUrl(url);
  
  // In a real Chrome extension, you would use chrome.downloads.download
  // to save the PDF to the user's device
  // For example:
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: url,
      filename: `terms_pdfs/${filename}`,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(`chrome://downloads/${downloadId}`);
      }
    });
  });
  
  // For demonstration, return a mock path
  return `downloads://${filename}`;
}

// Function to save a Blob as PDF
async function saveBlobAsPdf(blob: Blob, filenameBase: string): Promise<string> {
  const filename = `${filenameBase}_${Date.now()}.pdf`;
  
  // In a real Chrome extension, you would:
  // 1. Create an object URL from the blob
  // 2. Use chrome.downloads.download to save it
  // For example:

  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: url,
      filename: `terms_pdfs/${filename}`,
      saveAs: false
    }, (downloadId) => {
      URL.revokeObjectURL(url);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(`chrome://downloads/${downloadId}`);
      }
    });
  });
  
  // For demonstration, return a mock path
  return `downloads://${filename}`;
}

// Helper function to get a filename from a PDF URL
function getPdfFilenameFromUrl(url: string): string {
  // Extract filename from URL
  let filename = url.split('/').pop() || 'document.pdf';
  
  // Remove query parameters if present
  filename = filename.split('?')[0];
  
  // Make sure it has .pdf extension
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  
  return `terms_${Date.now()}_${decodeURIComponent(filename)}`;
}

// Main function to analyze terms and conditions
export async function analyzeTermsAndConditions(url: string, timeoutMs: number = 5000) {
  try {
    const result = await extractTermsAndConditions(url, timeoutMs);
    return result;
  } catch (error) {
    return { 
      success: false, 
      message: "Error processing content", 
      error: error,
      sourceUrl: url
    };
  }
}
// --------- Helper Functions for Filtering Links ---------
function isInExcludedContainer(element) {
    let parent = element.parentElement;
    while (parent) {
      const tagName = parent.tagName.toLowerCase();
      if (tagName === 'header' || tagName === 'nav' || tagName === 'footer') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }
  
  function getDependentPageLinks(doc, baseUrl) {
    const links = Array.from(doc.querySelectorAll('a'));
    const filteredLinks = links.filter(link => {
      if (isInExcludedContainer(link)) return false;
      try {
        const linkUrl = new URL(link.getAttribute('href'), baseUrl);
        if (linkUrl.origin !== new URL(baseUrl).origin) return false;
      } catch (e) {
        return false;
      }
      return true;
    });
    return filteredLinks.map(link => new URL(link.getAttribute('href'), baseUrl).href);
  }
  
  function extractHtmlContent(doc) {
    removeUnwantedElements(doc);
    return doc.body ? doc.body.innerText : '';
  }
  
  // --------- PDF Extraction Function ---------
  function extractPdfContent(pdfUrl) {
    if (typeof pdfjsLib === 'undefined') {
      console.error('PDF.js library is not loaded');
      document.getElementById('output').textContent = 'PDF.js library is not loaded';
      return;
    }
    
    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
      const numPages = pdf.numPages;
      const pagePromises = [];
  
      for (let i = 1; i <= numPages; i++) {
        pagePromises.push(
          pdf.getPage(i).then(page => {
            return page.getTextContent().then(textContent => {
              return textContent.items.map(item => item.str).join(' ');
            });
          })
        );
      }
  
      Promise.all(pagePromises).then(pagesText => {
        const fullText = pagesText.join('\n\n');
        console.log('PDF Content:', fullText);
        document.getElementById('output').textContent = fullText;
      });
    }).catch(error => {
      console.error('Error extracting PDF content:', error);
      document.getElementById('output').textContent = 'Error extracting PDF: ' + error;
    });
  }
  
  // --------- Functions to Fetch and Extract Dependent Link Text ---------
  function fetchDependentLinkText(url) {
    return fetch(url)
      .then(response => response.text())
      .then(htmlString => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body ? doc.body.innerText : '';
      })
      .catch(error => {
        console.error(`Error fetching ${url}:`, error);
        return '';
      });
  }
  
  async function extractDependentLinksText(links) {
    const results = await Promise.all(
      links.map(async (url) => await fetchDependentLinkText(url))
    );
    return results;
  }
  
  function removeUnwantedElements(doc) {
    // Remove script elements
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // If needed, you can remove other elements too, e.g.:
    // const styles = doc.querySelectorAll('style');
    // styles.forEach(style => style.remove());
  }
  
  // --------- Main Extraction Function (for a given URL) ---------
  async function extractContentFromUrl(url) {
    if (url.toLowerCase().endsWith('.pdf')) {
      extractPdfContent(url);
      return;
    }
    
    try {
      const response = await fetch(url);
      const htmlString = await response.text();
  
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
  
      const htmlContent = extractHtmlContent(doc);
      //const dependentLinks = getDependentPageLinks(doc, url);
      //const dependentLinksText = await extractDependentLinksText(dependentLinks);
      
      //const fullContent = htmlContent + "\n\n" + dependentLinksText.join("\n\n");
      console.log(htmlContent);
      document.getElementById('output').textContent = htmlContent;
      return htmlContent;
    } catch (error) {
      console.error('Error fetching or processing URL:', error);
      document.getElementById('output').textContent = 'Error: ' + error;
    }
  }
  
  document.getElementById('extractBtn').addEventListener('click', async function(){
    const url = document.getElementById('urlInput').value;
    document.getElementById('output').textContent = "Extracting...";
    await extractContentFromUrl(url);
  });
  
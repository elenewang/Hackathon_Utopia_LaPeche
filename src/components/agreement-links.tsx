/**
 * Finds all links near checkboxes that might be related to terms/conditions
 * Searches up to 4 parent levels from each checkbox
 * @returns Array of objects containing the link URL and text
 */
export const findNearbyAgreementLinks = (): { url: string; text: string }[] => {
    // Find all checkboxes in the document
    const checkboxes = Array.from(
      document.querySelectorAll('input[type="checkbox"]')
    );
    
    const links: { url: string; text: string }[] = [];
    const processedUrls = new Set<string>(); // To avoid duplicates
    
    // Keywords that might indicate terms/agreement links
    const agreementKeywords = [
      'terms',
      'conditions',
      'agreement',
      'policy',
      'privacy',
      'consent',
      'accept',
      'legal',
    ];
    
    checkboxes.forEach((checkbox) => {
      // Start with the checkbox element
      let currentElement: HTMLElement | null = checkbox as HTMLElement;
      let level = 0;
      
      // Search up to 7 parent levels
      while (currentElement && level < 7) {
        // Find all links within this element
        const nearbyLinks = Array.from(
          currentElement.querySelectorAll('a')
        ) as HTMLAnchorElement[];
        
        nearbyLinks.forEach((link) => {
          const linkUrl = link.href;
          const linkText = link.textContent?.toLowerCase() || '';
          
          // Skip if we've already processed this URL
          if (processedUrls.has(linkUrl)) return;
          
          // Check if the link text contains any of our keywords
          const isAgreementLink = agreementKeywords.some(keyword => 
            linkText.includes(keyword)
          );
          
          // If it looks like an agreement link or we're at the closest level to the checkbox
          if (isAgreementLink || level === 0) {
            links.push({
              url: linkUrl,
              text: link.textContent?.trim() || linkUrl
            });
            processedUrls.add(linkUrl);
          }
        });
        
        // Move up to the parent element
        currentElement = currentElement.parentElement;
        level++;
      }
    });
    
    console.log('Found agreement links:', links);
    return links;
  };
  
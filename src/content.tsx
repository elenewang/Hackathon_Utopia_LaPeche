import { createRoot } from 'react-dom/client';
import { Scanner } from './components/Scanner';
import styles from './content.module.css';
import { findNearbyAgreementLinks } from './components/agreement-links';

console.log('Content script starting...');

// Prevent PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
});

const observer = new MutationObserver(() => {
  const links = findNearbyAgreementLinks();
  if (links && links.length > 0) {
    observer.disconnect(); // stop watching once we find something

    const container = document.createElement('div');
    container.id = 'policy-scanner-root';
    container.className = styles.container;
    document.body.appendChild(container);

    try {
      createRoot(container).render(<Scanner links={links} />);
      console.log('Scanner mounted via MutationObserver');
    } catch (error) {
      console.error('Error mounting Scanner component:', error);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});



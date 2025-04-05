chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received:', message);
    sendResponse({status: 'Message received'});
  });
  
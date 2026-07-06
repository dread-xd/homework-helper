const http = require('http');

// Get extension ID from the tabs list
http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const tabs = JSON.parse(data);
    const extTab = tabs.find(t => t.title === 'Homework Helper');
    console.log('Extension tab:', extTab?.url);
    
    // Check background page
    const bgTab = tabs.find(t => t.title === 'Service Worker');
    console.log('Background:', bgTab?.url);
    
    const quizTab = tabs.find(t => t.title && t.title.includes('Math Quiz'));
    console.log('Quiz tab:', quizTab?.url);
    
    // The extension ID from the URL
    const extId = extTab?.url?.match(/chrome-extension:\/\/([^/]+)/)?.[1];
    console.log('Extension ID:', extId);
    
    // List all tabs
    tabs.forEach(t => console.log(`  [${t.id}] ${t.title}: ${t.url?.substring(0, 80)}`));
  });
});

const WebSocket = require('ws');
const http = require('http');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const tabs = JSON.parse(data);
    const tab = tabs.find(t => t.title && t.title.includes('Math Quiz'));
    if (!tab) { console.log('Quiz tab not found'); return; }
    console.log('Found quiz tab:', tab.id);

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 0;

    ws.on('open', () => {
      id++;
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
        expression: `document.dispatchEvent(new CustomEvent('homework:autoFill')); 'canned fill triggered'`,
      }}));

      setTimeout(() => {
        id++;
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
          expression: `JSON.stringify({
            name: document.querySelector('[name=student_name]')?.value,
            q2: document.querySelector('[name=q2]')?.value,
            q3: document.querySelector('[name=q3]')?.value
          })`,
        }}));
      }, 500);
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === 1) console.log('Event:', msg.result?.result?.value);
      if (msg.id === 2) {
        console.log('Filled:', msg.result?.result?.value);
        ws.close();
      }
    });
  });
});

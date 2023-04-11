const chromeLauncher = require("chrome-launcher");
const chromeRemoteInterface = require("chrome-remote-interface");

async function runApp() {
  // Launch a new Chrome instance
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--disable-gpu", "--headless"],
  });

  // Connect to the Chrome instance using the chrome-remote-interface library
  const client = await chromeRemoteInterface({
    port: chrome.port,
  });

  // Extract the required domains from the client
  const { Page, Network } = client;

  // Enable the required domains
  await Promise.all([Page.enable(), Network.enable()]);

  // Listen to the FrameNavigated event
  let mainFrameRequestId;
  Page.frameNavigated(async ({ frame }) => {
    if (!frame.parentId) {
      mainFrameRequestId = frame.loaderId;
    }
  });

  // Open a new tab and navigate to the specified URL
  await Page.navigate({ url: "https://example.com" });

  // Wait for the page to finish loading
  Page.loadEventFired(async () => {
    console.log("Page loaded successfully.");

    // Get the response body using the getResponseBody method
    const { body } = await Network.getResponseBody({
      requestId: mainFrameRequestId,
    });

    console.log("HTML Content:");
    console.log(body);

    // Close the client and the Chrome instance
    await client.close();
    await chrome.kill();
  });
}

runApp().catch(console.error);

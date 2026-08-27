const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class DriverFactory {
  static async build() {
    const options = new chrome.Options();
    if (process.env.CI) {
      options.addArguments('--headless');
    }
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    return driver;
  }
}

module.exports = DriverFactory;

/**
 * AgroRent AI — Base Page Object Model (Appium Mobile & Web)
 */

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector, timeout = 10000) {
    if (!this.driver) return null;
    return await this.driver.findElement(selector);
  }

  async click(selector) {
    const el = await this.findElement(selector);
    if (el) await el.click();
  }

  async type(selector, text) {
    const el = await this.findElement(selector);
    if (el) await el.sendKeys(text);
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    return el ? await el.getText() : '';
  }

  async isDisplayed(selector) {
    try {
      const el = await this.findElement(selector);
      return el ? await el.isDisplayed() : false;
    } catch (e) {
      return false;
    }
  }
}

module.exports = BasePage;

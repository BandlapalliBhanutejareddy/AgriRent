from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class MobileBasePage:
    def __init__(self, driver, timeout=15):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(driver, timeout)

    def find(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_by_accessibility_id(self, acc_id: str):
        return self.wait.until(EC.presence_of_element_located((AppiumBy.ACCESSIBILITY_ID, acc_id)))

    def click_by_accessibility_id(self, acc_id: str):
        el = self.wait.until(EC.element_to_be_clickable((AppiumBy.ACCESSIBILITY_ID, acc_id)))
        el.click()

    def type_by_accessibility_id(self, acc_id: str, text: str):
        el = self.find_by_accessibility_id(acc_id)
        el.clear()
        el.send_keys(text)

    def swipe_up(self):
        size = self.driver.get_window_size()
        start_x = size['width'] // 2
        start_y = int(size['height'] * 0.8)
        end_y = int(size['height'] * 0.2)
        self.driver.swipe(start_x, start_y, start_x, end_y, 800)

    def swipe_down(self):
        size = self.driver.get_window_size()
        start_x = size['width'] // 2
        start_y = int(size['height'] * 0.2)
        end_y = int(size['height'] * 0.8)
        self.driver.swipe(start_x, start_y, start_x, end_y, 800)

    def save_screenshot(self, filepath: str):
        self.driver.save_screenshot(filepath)

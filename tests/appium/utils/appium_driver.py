import os
from appium import webdriver
from appium.options.android import UiAutomator2Options

def create_appium_driver(
    appium_server_url: str = "http://localhost:4723",
    app_path: str = None,
    device_name: str = "emulator-5554"
):
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"
    options.device_name = device_name
    options.app_package = "com.agrorent.ai"
    options.app_activity = ".MainActivity"
    options.no_reset = False
    options.new_command_timeout = 180
    options.auto_grant_permissions = True
    
    if app_path and os.path.exists(app_path):
        options.app = os.path.abspath(app_path)

    driver = webdriver.Remote(appium_server_url, options=options)
    driver.implicitly_wait(10)
    return driver

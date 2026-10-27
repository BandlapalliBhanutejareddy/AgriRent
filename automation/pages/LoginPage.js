const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = '~email_input';
    this.passwordInput = '~password_input';
    this.farmerRoleToggle = '~role_farmer_btn';
    this.ownerRoleToggle = '~role_owner_btn';
    this.loginButton = '~login_submit_btn';
    this.googleSignInButton = '~google_signin_btn';
    this.registerLink = '~go_to_register_btn';
    this.errorMessage = '~auth_error_banner';
  }

  async login(email, password, role = 'FARMER') {
    if (role === 'OWNER') {
      await this.click(this.ownerRoleToggle);
    } else {
      await this.click(this.farmerRoleToggle);
    }
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async isErrorBannerVisible() {
    return await this.isDisplayed(this.errorMessage);
  }
}

module.exports = LoginPage;

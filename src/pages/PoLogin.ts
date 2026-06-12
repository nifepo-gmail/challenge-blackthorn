import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export class PoLogin extends BasePage {
  locators = {
    loginForm: {
      usernameInput: this.page.locator('[data-test="username"]'),
      passwordInput: this.page.locator('[data-test="password"]'),
      loginButton:   this.page.locator('[data-test="login-button"]'),
      errorMessage:  this.page.locator('[data-test="error"]'),
    },
  };

  messages = {
    errorLocked:             'Epic sadface: Sorry, this user has been locked out.',
    errorInvalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
    errorUsernameRequired:   'Epic sadface: Username is required',
    errorPasswordRequired:   'Epic sadface: Password is required',
  };

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillField(this.locators.loginForm.usernameInput, username, 'username');
    await this.fillField(this.locators.loginForm.passwordInput, password, 'password');
    await this.clickElement(this.locators.loginForm.loginButton, 'Login button');
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.locators.loginForm.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.locators.loginForm.errorMessage);
  }
}

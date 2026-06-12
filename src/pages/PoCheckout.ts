import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export class PoCheckout extends BasePage {
  locators = {
    contactForm: {
      firstNameInput:  this.page.locator('[data-test="firstName"]'),
      lastNameInput:   this.page.locator('[data-test="lastName"]'),
      postalCodeInput: this.page.locator('[data-test="postalCode"]'),
      continueButton:  this.page.locator('[data-test="continue"]'),
      errorMessage:    this.page.locator('[data-test="error"]'),
    },
    orderOverview: {
      finishButton:   this.page.locator('[data-test="finish"]'),
      itemTotalLabel: this.page.locator('.summary_subtotal_label'),
      taxLabel:       this.page.locator('.summary_tax_label'),
      totalLabel:     this.page.locator('.summary_total_label'),
      completeHeader: this.page.locator('[data-test="complete-header"]'),
    },
  };

  messages = {
    completeHeader: 'Thank you for your order!',
    completeSubtext: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
  };

  constructor(page: Page) {
    super(page);
  }

  async gotoStepOne(): Promise<void> {
    await this.navigate('/checkout-step-one.html');
  }

  async fillContactInfo(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.fillField(this.locators.contactForm.firstNameInput, firstName, 'First name');
    await this.fillField(this.locators.contactForm.lastNameInput, lastName, 'Last name');
    await this.fillField(this.locators.contactForm.postalCodeInput, postalCode, 'Postal code');
  }

  async continueToOverview(): Promise<void> {
    await this.clickElement(this.locators.contactForm.continueButton, 'Continue to overview');
  }

  async finishOrder(): Promise<void> {
    await this.clickElement(this.locators.orderOverview.finishButton, 'Finish order');
  }

  /**
   * Parses the item subtotal on the checkout overview page.
   * Format: "Item total: $XX.XX" → numeric value.
   * Revenue-critical: the displayed total must match the sum of individual cart prices.
   */
  async getItemTotal(): Promise<number> {
    const text = await this.getText(this.locators.orderOverview.itemTotalLabel);
    const match = text.match(/[\d.]+/);
    if (!match) throw new Error(`Could not parse item total from: "${text}"`);
    return parseFloat(match[0]);
  }

  async getTaxAmount(): Promise<number> {
    const text = await this.getText(this.locators.orderOverview.taxLabel);
    const match = text.match(/[\d.]+/);
    if (!match) throw new Error(`Could not parse tax from: "${text}"`);
    return parseFloat(match[0]);
  }

  async getGrandTotal(): Promise<number> {
    const text = await this.getText(this.locators.orderOverview.totalLabel);
    const match = text.match(/[\d.]+/);
    if (!match) throw new Error(`Could not parse grand total from: "${text}"`);
    return parseFloat(match[0]);
  }

  async getCompleteHeader(): Promise<string> {
    return this.getText(this.locators.orderOverview.completeHeader);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.locators.contactForm.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return this.isVisible(this.locators.contactForm.errorMessage);
  }
}

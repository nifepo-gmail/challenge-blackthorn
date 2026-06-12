import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export class PoCart extends BasePage {
  locators = {
    items: {
      names:         this.page.locator('[data-test="inventory-item-name"]'),
      prices:        this.page.locator('[data-test="inventory-item-price"]'),
      removeButtons: this.page.locator('[data-test^="remove-"]'),
    },
    footer: {
      checkoutButton:         this.page.locator('[data-test="checkout"]'),
      continueShoppingButton: this.page.locator('[data-test="continue-shopping"]'),
    },
  };

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/cart.html');
  }

  async getItemNames(): Promise<string[]> {
    return this.locators.items.names.allTextContents();
  }

  /**
   * Returns parsed prices from the cart.
   * Used to cross-check against the checkout summary total.
   */
  async getItemPrices(): Promise<number[]> {
    const texts = await this.locators.items.prices.allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async getItemCount(): Promise<number> {
    return this.locators.items.names.count();
  }

  async removeItem(itemName: string): Promise<void> {
    const removeBtn = this.page.locator(
      `[data-test="remove-${itemName.toLowerCase().replace(/ /g, '-')}"]`
    );
    await this.clickElement(removeBtn, `Remove: ${itemName}`);
  }

  async proceedToCheckout(): Promise<void> {
    await this.clickElement(this.locators.footer.checkoutButton, 'Proceed to checkout');
  }

  async continueShopping(): Promise<void> {
    await this.clickElement(this.locators.footer.continueShoppingButton, 'Continue shopping');
  }

  async isEmpty(): Promise<boolean> {
    return (await this.locators.items.names.count()) === 0;
  }
}

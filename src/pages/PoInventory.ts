import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export class PoInventory extends BasePage {
  locators = {
    productList: {
      itemNames:  this.page.locator('.inventory_item_name'),
      itemPrices: this.page.locator('.inventory_item_price'),
    },
    header: {
      cartBadge:  this.page.locator('[data-test="shopping-cart-badge"]'),
      cartLink:   this.page.locator('[data-test="shopping-cart-link"]'),
      sortSelect: this.page.locator('[data-test="product-sort-container"]'),
    },
  };

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/inventory.html');
  }

  async addItemToCart(itemName: string): Promise<void> {
    const btn = this.page.locator(
      `[data-test="add-to-cart-${itemName.toLowerCase().replace(/ /g, '-')}"]`
    );
    await this.clickElement(btn, `Add to cart: ${itemName}`);
  }

  async removeItemFromCart(itemName: string): Promise<void> {
    const btn = this.page.locator(
      `[data-test="remove-${itemName.toLowerCase().replace(/ /g, '-')}"]`
    );
    await this.clickElement(btn, `Remove from cart: ${itemName}`);
  }

  /**
   * Returns true if the "Add to Cart" button for the given item is present and enabled.
   * Used to detect problem_user broken add-to-cart behaviour.
   */
  async canAddToCart(itemName: string): Promise<boolean> {
    const btn = this.page.locator(
      `[data-test="add-to-cart-${itemName.toLowerCase().replace(/ /g, '-')}"]`
    );
    const count = await btn.count();
    if (count === 0) return false;
    return btn.isEnabled();
  }

  async getCartBadgeCount(): Promise<number> {
    const visible = await this.isVisible(this.locators.header.cartBadge);
    if (!visible) return 0;
    const text = await this.getText(this.locators.header.cartBadge);
    return parseInt(text, 10);
  }

  async goToCart(): Promise<void> {
    await this.clickElement(this.locators.header.cartLink, 'Cart link');
  }

  /**
   * Collects all visible item prices from the inventory page.
   * Parses "$X.XX" strings to floats for arithmetic assertions.
   */
  async getAllItemPrices(): Promise<number[]> {
    const priceTexts = await this.locators.productList.itemPrices.allTextContents();
    return priceTexts.map((t) => parseFloat(t.replace('$', '')));
  }
}

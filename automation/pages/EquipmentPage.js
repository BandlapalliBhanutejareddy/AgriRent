const BasePage = require('./BasePage');

class EquipmentPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.searchInput = '~search_equipment_bar';
    this.tractorCategoryChip = '~chip_category_TRACTOR';
    this.harvesterCategoryChip = '~chip_category_HARVESTER';
    this.priceSortDropdown = '~sort_price_dropdown';
    this.equipmentCard = '~equipment_item_card';
    this.bookNowButton = '~book_equipment_btn';
  }

  async searchEquipment(query) {
    await this.type(this.searchInput, query);
  }

  async selectCategory(category) {
    if (category === 'HARVESTER') {
      await this.click(this.harvesterCategoryChip);
    } else {
      await this.click(this.tractorCategoryChip);
    }
  }

  async clickFirstEquipment() {
    await this.click(this.equipmentCard);
  }

  async initiateBooking() {
    await this.click(this.bookNowButton);
  }
}

module.exports = EquipmentPage;

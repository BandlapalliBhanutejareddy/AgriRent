const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.farmerWelcomeHeader = '~farmer_welcome_banner';
    this.ownerRevenueKPI = '~owner_revenue_kpi';
    this.equipmentCatalogTab = '~nav_marketplace';
    this.bookingsTab = '~nav_bookings';
    this.digitalTwinFarmTab = '~nav_farms';
    this.profileTab = '~nav_profile';
    this.notificationsBell = '~notifications_icon';
    this.aiAdvisorFab = '~ai_advisor_fab';
  }

  async navigateToMarketplace() {
    await this.click(this.equipmentCatalogTab);
  }

  async navigateToBookings() {
    await this.click(this.bookingsTab);
  }

  async openNotifications() {
    await this.click(this.notificationsBell);
  }

  async launchAIAdvisor() {
    await this.click(this.aiAdvisorFab);
  }
}

module.exports = DashboardPage;

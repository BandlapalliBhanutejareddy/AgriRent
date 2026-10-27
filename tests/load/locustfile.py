import random
from locust import HttpUser, task, between

class AgroRentWebUser(HttpUser):
    wait_time = between(1, 3)

    @task(5)
    def test_homepage(self):
        self.client.get("/", name="[WEB] Homepage /")

    @task(3)
    def test_login_page(self):
        self.client.get("/login", name="[WEB] Login /login")

    @task(3)
    def test_register_page(self):
        self.client.get("/register", name="[WEB] Register /register")

    @task(4)
    def test_marketplace_page(self):
        self.client.get("/dashboard/marketplace", name="[WEB] Marketplace /dashboard/marketplace")

    @task(2)
    def test_admin_page(self):
        self.client.get("/dashboard/admin", name="[WEB] Admin /dashboard/admin")

    @task(2)
    def test_crop_guide(self):
        crop = random.choice(["rice", "wheat", "maize", "cotton", "sugarcane"])
        self.client.get(f"/dashboard/guides/{crop}", name="[WEB] Dynamic Crop Guide /dashboard/guides/[crop]")

class AgroRentApiUser(HttpUser):
    wait_time = between(0.5, 2)

    @task(6)
    def test_api_health(self):
        self.client.get("/api/health", name="[API] Health Check /api/health")

    @task(5)
    def test_api_equipment(self):
        self.client.get("/api/equipment", name="[API] Equipment List /api/equipment")

    @task(4)
    def test_api_categories(self):
        self.client.get("/api/equipment/categories", name="[API] Categories /api/equipment/categories")

    @task(3)
    def test_api_bookings(self):
        self.client.get("/api/bookings", name="[API] Bookings List /api/bookings")

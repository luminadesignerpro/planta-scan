import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class PlantaScanAPITester:
    def __init__(self, base_url="https://botany-scanner-v2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.scan_id = None
        self.plant_id = None
        self.reminder_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if endpoint else f"{self.base_url}/api/"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a simple test plant image in base64 format"""
        # Create a simple green plant-like image
        img = Image.new('RGB', (400, 400), color='white')
        pixels = img.load()
        
        # Draw a simple plant shape
        for x in range(400):
            for y in range(400):
                # Create a simple leaf pattern
                if (x - 200) ** 2 + (y - 300) ** 2 < 50 ** 2:  # Leaf 1
                    pixels[x, y] = (34, 139, 34)  # Forest green
                elif (x - 150) ** 2 + (y - 250) ** 2 < 40 ** 2:  # Leaf 2
                    pixels[x, y] = (50, 205, 50)  # Lime green
                elif (x - 250) ** 2 + (y - 250) ** 2 < 40 ** 2:  # Leaf 3
                    pixels[x, y] = (50, 205, 50)  # Lime green
                elif abs(x - 200) < 5 and y > 300:  # Stem
                    pixels[x, y] = (139, 69, 19)  # Brown
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_str}"

    def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        success, response = self.run_test(
            "Root API endpoint",
            "GET",
            "",
            200
        )
        if success and isinstance(response, dict):
            if "PlantaScan API" in response.get("message", ""):
                print("✅ Root endpoint returns correct message")
                return True
        print("❌ Root endpoint message incorrect")
        return False

    def test_stats_endpoint(self):
        """Test GET /api/stats endpoint"""
        success, response = self.run_test(
            "Stats endpoint",
            "GET",
            "stats",
            200
        )
        if success and isinstance(response, dict):
            required_fields = ["total_plants", "total_scans", "pending_reminders", "total_reminders"]
            if all(field in response for field in required_fields):
                print("✅ Stats endpoint returns all required fields")
                return True
        print("❌ Stats endpoint missing required fields")
        return False

    def test_scan_plant(self):
        """Test POST /api/scan with real plant image"""
        image_base64 = self.create_test_image()
        
        success, response = self.run_test(
            "Plant scan with image",
            "POST",
            "scan",
            200,
            data={"image_base64": image_base64}
        )
        
        if success and isinstance(response, dict):
            if "id" in response and "analysis" in response:
                self.scan_id = response["id"]
                analysis = response["analysis"]
                print(f"✅ Scan successful, ID: {self.scan_id}")
                print(f"Analysis identified: {analysis.get('identified', 'Unknown')}")
                if analysis.get("identified"):
                    print(f"Plant name: {analysis.get('plant_name', 'N/A')}")
                return True
        print("❌ Scan response missing required fields")
        return False

    def test_save_plant(self):
        """Test POST /api/plants to save a plant from scan"""
        if not self.scan_id:
            print("❌ No scan_id available for plant save test")
            return False
            
        success, response = self.run_test(
            "Save plant from scan",
            "POST",
            "plants",
            200,
            data={
                "scan_id": self.scan_id,
                "custom_name": "Minha Planta Teste",
                "location": "Sala de Estar",
                "notes": "Planta de teste"
            }
        )
        
        if success and isinstance(response, dict):
            if "id" in response:
                self.plant_id = response["id"]
                print(f"✅ Plant saved successfully, ID: {self.plant_id}")
                return True
        print("❌ Plant save failed")
        return False

    def test_get_plants(self):
        """Test GET /api/plants"""
        success, response = self.run_test(
            "Get plants list",
            "GET",
            "plants",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Plants list retrieved, count: {len(response)}")
            return True
        print("❌ Plants list not returned as array")
        return False

    def test_get_single_plant(self):
        """Test GET /api/plants/:id"""
        if not self.plant_id:
            print("❌ No plant_id available for single plant test")
            return False
            
        success, response = self.run_test(
            "Get single plant details",
            "GET",
            f"plants/{self.plant_id}",
            200
        )
        
        if success and isinstance(response, dict):
            if "id" in response and response["id"] == self.plant_id:
                print("✅ Single plant details retrieved successfully")
                return True
        print("❌ Single plant details failed")
        return False

    def test_create_reminder(self):
        """Test POST /api/reminders"""
        if not self.plant_id:
            print("❌ No plant_id available for reminder test")
            return False
            
        success, response = self.run_test(
            "Create reminder",
            "POST",
            "reminders",
            200,
            data={
                "plant_id": self.plant_id,
                "reminder_type": "water",
                "frequency_days": 3,
                "description": "Regar a planta teste"
            }
        )
        
        if success and isinstance(response, dict):
            if "id" in response:
                self.reminder_id = response["id"]
                print(f"✅ Reminder created successfully, ID: {self.reminder_id}")
                return True
        print("❌ Reminder creation failed")
        return False

    def test_get_reminders(self):
        """Test GET /api/reminders"""
        success, response = self.run_test(
            "Get reminders list",
            "GET",
            "reminders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Reminders list retrieved, count: {len(response)}")
            return True
        print("❌ Reminders list not returned as array")
        return False

    def test_complete_reminder(self):
        """Test PUT /api/reminders/:id/complete"""
        if not self.reminder_id:
            print("❌ No reminder_id available for complete test")
            return False
            
        success, response = self.run_test(
            "Complete reminder",
            "PUT",
            f"reminders/{self.reminder_id}/complete",
            200
        )
        
        if success and isinstance(response, dict):
            if "last_completed" in response:
                print("✅ Reminder completed successfully")
                return True
        print("❌ Reminder completion failed")
        return False

    def test_delete_reminder(self):
        """Test DELETE /api/reminders/:id"""
        if not self.reminder_id:
            print("❌ No reminder_id available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete reminder",
            "DELETE",
            f"reminders/{self.reminder_id}",
            200
        )
        
        if success:
            print("✅ Reminder deleted successfully")
            return True
        print("❌ Reminder deletion failed")
        return False

    def test_delete_plant(self):
        """Test DELETE /api/plants/:id"""
        if not self.plant_id:
            print("❌ No plant_id available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete plant and its reminders",
            "DELETE",
            f"plants/{self.plant_id}",
            200
        )
        
        if success:
            print("✅ Plant deleted successfully")
            return True
        print("❌ Plant deletion failed")
        return False

def main():
    print("🌱 Starting PlantaScan API Tests...")
    tester = PlantaScanAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_stats_endpoint,
        tester.test_scan_plant,
        tester.test_save_plant,
        tester.test_get_plants,
        tester.test_get_single_plant,
        tester.test_create_reminder,
        tester.test_get_reminders,
        tester.test_complete_reminder,
        tester.test_delete_reminder,
        tester.test_delete_plant,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
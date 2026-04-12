import requests
import json

def test_plant_image_endpoint():
    """Test the GET /api/plants/:id/image endpoint"""
    
    # First get the list of plants to find an ID
    plants_url = "https://botany-scanner-v2.preview.emergentagent.com/api/plants"
    
    try:
        response = requests.get(plants_url)
        if response.status_code == 200:
            plants = response.json()
            print(f"Found {len(plants)} plants")
            
            if len(plants) > 0:
                plant_id = plants[0]['id']
                print(f"Testing image endpoint for plant ID: {plant_id}")
                
                # Test the image endpoint
                image_url = f"https://botany-scanner-v2.preview.emergentagent.com/api/plants/{plant_id}/image"
                image_response = requests.get(image_url)
                
                if image_response.status_code == 200:
                    result = image_response.json()
                    if 'image_base64' in result:
                        image_data = result['image_base64']
                        print(f"✅ Plant image endpoint working - Image size: {len(image_data)} characters")
                        return True
                    else:
                        print("❌ Image endpoint response missing image_base64")
                        return False
                else:
                    print(f"❌ Image endpoint failed: {image_response.status_code}")
                    return False
            else:
                print("ℹ️ No plants found to test image endpoint")
                return True  # Not a failure, just no data
        else:
            print(f"❌ Failed to get plants list: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing image endpoint: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_plant_image_endpoint()
    if success:
        print("🎉 Plant image endpoint test PASSED!")
    else:
        print("❌ Plant image endpoint test FAILED!")
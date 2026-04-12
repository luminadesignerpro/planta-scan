import requests
import base64
import json

def test_ai_scan_with_real_image():
    """Test AI scan with real plant image from Unsplash"""
    
    # Read the downloaded plant image
    with open('/app/cactus_plant.jpg', 'rb') as f:
        image_data = f.read()
    
    # Convert to base64
    image_base64 = base64.b64encode(image_data).decode()
    image_data_url = f"data:image/jpeg;base64,{image_base64}"
    
    # Test the scan endpoint
    url = "https://botany-scanner-v2.preview.emergentagent.com/api/scan"
    payload = {"image_base64": image_data_url}
    
    print("🔍 Testing AI scan with real plant image...")
    print(f"Image size: {len(image_data)} bytes")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI scan successful!")
            print(f"Scan ID: {result.get('id')}")
            
            analysis = result.get('analysis', {})
            print(f"Identified: {analysis.get('identified')}")
            
            if analysis.get('identified'):
                print(f"Plant name: {analysis.get('plant_name')}")
                print(f"Scientific name: {analysis.get('scientific_name')}")
                print(f"Health status: {analysis.get('health_status')}")
                print(f"Health score: {analysis.get('health_score')}%")
                
                if analysis.get('diseases'):
                    print(f"Diseases detected: {len(analysis.get('diseases'))}")
                
                if analysis.get('care_tips'):
                    print("Care tips provided: ✅")
                
                return True, result
            else:
                print(f"❌ Plant not identified: {analysis.get('error', 'Unknown error')}")
                return False, result
        else:
            print(f"❌ Request failed: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False, None

if __name__ == "__main__":
    success, result = test_ai_scan_with_real_image()
    if success:
        print("\n🎉 AI integration test PASSED!")
    else:
        print("\n❌ AI integration test FAILED!")
import requests
import base64
import json

def test_real_plant_scan():
    """Test the AI scan with a real plant image"""
    
    # Read the downloaded plant image
    with open('/app/plant_test.jpg', 'rb') as f:
        image_data = f.read()
    
    # Convert to base64
    image_base64 = base64.b64encode(image_data).decode()
    image_with_prefix = f"data:image/jpeg;base64,{image_base64}"
    
    # Test the scan endpoint
    url = "https://botany-scanner-v2.preview.emergentagent.com/api/scan"
    
    print("🌿 Testing AI plant scan with real plant image...")
    print("📸 Image size:", len(image_data), "bytes")
    
    try:
        response = requests.post(url, json={
            "image_base64": image_with_prefix
        }, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get("analysis", {})
            
            print("✅ AI Scan successful!")
            print(f"Scan ID: {result.get('id')}")
            print(f"Identified: {analysis.get('identified')}")
            
            if analysis.get('identified'):
                print(f"Plant Name: {analysis.get('plant_name')}")
                print(f"Scientific Name: {analysis.get('scientific_name')}")
                print(f"Health Status: {analysis.get('health_status')}")
                print(f"Health Score: {analysis.get('health_score')}%")
                
                if analysis.get('diseases'):
                    print(f"Diseases detected: {len(analysis['diseases'])}")
                    
                if analysis.get('care_tips'):
                    print("Care tips provided: ✅")
                    
                return True
            else:
                print(f"❌ Plant not identified: {analysis.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_real_plant_scan()
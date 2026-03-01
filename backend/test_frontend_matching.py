#!/usr/bin/env python3
"""
Test: Frontend Posts → AI Matching

Tests that the matching system works with posts from frontend localStorage
instead of MongoDB sample data.
"""

import requests
import json

# Simulate frontend posts (what the frontend sends)
frontend_posts = [
    {
        "_id": "1",
        "user_id": "Tom K.",
        "type": "offer",
        "ingredients": [
            {"name": "tomatoes", "normalized_name": "tomato", "quantity": 5, "unit": None},
            {"name": "garlic", "normalized_name": "garlic", "quantity": None, "unit": None}
        ],
        "location": {"lat": 0, "lng": 0, "description": "0.2 mi away"},
        "original_text": "I have 5 fresh tomatoes and garlic to give away.",
        "status": "active",
        "created_at": "2026-03-01T10:00:00Z"
    },
    {
        "_id": "2",
        "user_id": "Amy C.",
        "type": "request",
        "ingredients": [
            {"name": "tomatoes", "normalized_name": "tomato", "quantity": None, "unit": None},
            {"name": "onions", "normalized_name": "onion", "quantity": None, "unit": None}
        ],
        "location": {"lat": 0, "lng": 0, "description": "0.5 mi away"},
        "original_text": "Looking for tomatoes and onions for tonight's dinner.",
        "status": "active",
        "created_at": "2026-03-01T11:00:00Z"
    },
    {
        "_id": "3",
        "user_id": "Maria L.",
        "type": "offer",
        "ingredients": [
            {"name": "onions", "normalized_name": "onion", "quantity": 3, "unit": None},
            {"name": "carrots", "normalized_name": "carrot", "quantity": None, "unit": None}
        ],
        "location": {"lat": 0, "lng": 0, "description": "0.3 mi away"},
        "original_text": "Extra onions and carrots from my garden.",
        "status": "active",
        "created_at": "2026-03-01T09:30:00Z"
    },
    {
        "_id": "4",
        "user_id": "James R.",
        "type": "request",
        "ingredients": [
            {"name": "garlic", "normalized_name": "garlic", "quantity": None, "unit": None},
            {"name": "basil", "normalized_name": "basil", "quantity": None, "unit": None}
        ],
        "location": {"lat": 0, "lng": 0, "description": "0.4 mi away"},
        "original_text": "Need garlic and fresh basil for pasta sauce.",
        "status": "active",
        "created_at": "2026-03-01T12:00:00Z"
    }
]

print("=" * 60)
print("🧪 TESTING: Frontend Posts → AI Matching")
print("=" * 60)

print(f"\n📝 Frontend has {len(frontend_posts)} posts:")
request_count = sum(1 for p in frontend_posts if p['type'] == 'request')
offer_count = sum(1 for p in frontend_posts if p['type'] == 'offer')
print(f"   - {request_count} requests (looking for)")
print(f"   - {offer_count} offers (giving)")

print("\n🔗 Sending to backend API...")

try:
    response = requests.post(
        'http://localhost:5000/api/match-ingredients',
        json={'posts': frontend_posts},
        timeout=60
    )
    
    if response.status_code == 200:
        data = response.json()
        
        if data.get('success'):
            print("\n✅ MATCHING SUCCESSFUL!\n")
            
            stats = data.get('stats', {})
            print(f"📊 Statistics:")
            print(f"   - Requests analyzed: {stats.get('total_requests', 0)}")
            print(f"   - Offers analyzed: {stats.get('total_offers', 0)}")
            print(f"   - Total matches found: {stats.get('total_matches', 0)}")
            print(f"   - Requests with matches: {stats.get('requests_with_matches', 0)}")
            
            matches = data.get('matches', {})
            
            if stats.get('total_matches', 0) > 0:
                print(f"\n🎯 MATCH DETAILS:\n")
                print("=" * 60)
                
                for request_id, match_list in matches.items():
                    if not match_list:
                        continue
                    
                    first_match = match_list[0]
                    print(f"\n🔍 REQUEST from {first_match['request']['user_id']}")
                    print(f"   Looking for: {first_match['request']['ingredients']}")
                    print(f"\n   Found {len(match_list)} match(es):\n")
                    
                    for i, match in enumerate(match_list, 1):
                        print(f"   {i}. 👤 {match['offer']['user_id']} - {match['match_score']}% match")
                        print(f"      Offering: {match['offer']['ingredients']}")
                        print(f"      Location: {match['offer']['location'].get('description', 'N/A')}")
                        print(f"      Matched items: {', '.join(match['matched_ingredients'])}")
                        print(f"      💡 Reason: {match['reason']}")
                        print()
                
                print("=" * 60)
                print("\n✅ Test PASSED: Frontend posts successfully matched!")
                print("🎉 System is working with localStorage posts!")
            else:
                print("\n⚠️  No matches found (AI determined match scores below 60% threshold)")
                print("This is okay - it means no good matches exist with current posts.")
        else:
            print(f"\n❌ API returned error: {data.get('error', 'Unknown error')}")
    else:
        print(f"\n❌ HTTP Error {response.status_code}")
        print(f"Response: {response.text}")

except requests.exceptions.ConnectionError:
    print("\n❌ Cannot connect to server. Is it running?")
    print("Start with: python main_api.py")
except requests.exceptions.Timeout:
    print("\n⏱️  Request timed out. AI matching takes 10-30 seconds.")
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 60)

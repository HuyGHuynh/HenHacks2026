#!/usr/bin/env python3
"""
Test script for Gemini Ingredient Matcher
Adds sample data to MongoDB and runs matching
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def add_sample_posts():
    """Add sample posts to MongoDB for testing"""
    
    connection_string = os.getenv('MONGODB_URI')
    if not connection_string:
        print("❌ MONGODB_URI not found in environment variables")
        return False
    
    try:
        # Connect to MongoDB
        client = MongoClient(connection_string)
        db = client['freshloop_community']
        collection = db['community_posts']
        
        print("✅ Connected to MongoDB")
        
        # Sample posts
        sample_posts = [
            # Requests (users looking for ingredients)
            {
                'user_id': 'alice123',
                'type': 'request',
                'ingredients': [
                    {'name': 'tomatoes', 'normalized_name': 'tomato', 'quantity': 2.0, 'unit': 'cups'},
                    {'name': 'onions', 'normalized_name': 'onion', 'quantity': 1.0, 'unit': None},
                    {'name': 'garlic', 'normalized_name': 'garlic', 'quantity': None, 'unit': None}
                ],
                'location': {'lat': 40.7128, 'lng': -74.0060, 'description': 'Downtown NYC'},
                'original_text': 'Need: 2 cups tomatoes, 1 onion, garlic',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            {
                'user_id': 'bob456',
                'type': 'request',
                'ingredients': [
                    {'name': 'chicken breast', 'normalized_name': 'chicken breast', 'quantity': 1.0, 'unit': 'lb'},
                    {'name': 'rice', 'normalized_name': 'rice', 'quantity': None, 'unit': None}
                ],
                'location': {'lat': 40.7580, 'lng': -73.9855, 'description': 'Midtown'},
                'original_text': 'Need: 1 lb chicken breast, rice',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            {
                'user_id': 'carol789',
                'type': 'request',
                'ingredients': [
                    {'name': 'basil', 'normalized_name': 'basil', 'quantity': None, 'unit': None},
                    {'name': 'mozzarella', 'normalized_name': 'mozzarella', 'quantity': None, 'unit': None}
                ],
                'location': {'lat': 40.7282, 'lng': -73.7949, 'description': 'Queens'},
                'original_text': 'Need: fresh basil, mozzarella cheese',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            
            # Offers (users giving ingredients)
            {
                'user_id': 'dave101',
                'type': 'offer',
                'ingredients': [
                    {'name': 'cherry tomatoes', 'normalized_name': 'cherry tomato', 'quantity': 3.0, 'unit': 'cups'},
                    {'name': 'red onions', 'normalized_name': 'red onion', 'quantity': 2.0, 'unit': None}
                ],
                'location': {'lat': 40.7128, 'lng': -74.0060, 'description': 'Downtown NYC'},
                'original_text': 'Offering: 3 cups cherry tomatoes, 2 red onions',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            {
                'user_id': 'eve202',
                'type': 'offer',
                'ingredients': [
                    {'name': 'chicken thighs', 'normalized_name': 'chicken thigh', 'quantity': 2.0, 'unit': 'lbs'},
                    {'name': 'brown rice', 'normalized_name': 'brown rice', 'quantity': 1.0, 'unit': 'lb'}
                ],
                'location': {'lat': 40.7580, 'lng': -73.9855, 'description': 'Midtown'},
                'original_text': 'Offering: 2 lbs chicken thighs, 1 lb brown rice',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            {
                'user_id': 'frank303',
                'type': 'offer',
                'ingredients': [
                    {'name': 'cilantro', 'normalized_name': 'cilantro', 'quantity': None, 'unit': None},
                    {'name': 'parmesan', 'normalized_name': 'parmesan', 'quantity': None, 'unit': None}
                ],
                'location': {'lat': 40.7282, 'lng': -73.7949, 'description': 'Queens'},
                'original_text': 'Offering: fresh cilantro, parmesan cheese',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            },
            {
                'user_id': 'grace404',
                'type': 'offer',
                'ingredients': [
                    {'name': 'tomatoes', 'normalized_name': 'tomato', 'quantity': 5.0, 'unit': None},
                    {'name': 'garlic cloves', 'normalized_name': 'garlic clove', 'quantity': 10.0, 'unit': None}
                ],
                'location': {'lat': 40.7128, 'lng': -74.0060, 'description': 'Downtown NYC'},
                'original_text': 'Offering: 5 fresh tomatoes, 10 garlic cloves',
                'status': 'active',
                'created_at': datetime.now().isoformat()
            }
        ]
        
        # Clear existing sample posts (optional)
        print("\n🗑️  Clearing existing sample posts...")
        collection.delete_many({'user_id': {'$in': ['alice123', 'bob456', 'carol789', 'dave101', 'eve202', 'frank303', 'grace404']}})
        
        # Insert sample posts
        print("\n📝 Inserting sample posts...")
        result = collection.insert_many(sample_posts)
        
        print(f"✅ Inserted {len(result.inserted_ids)} sample posts")
        print(f"\nSample posts added:")
        print(f"  - Requests: 3 (alice123, bob456, carol789)")
        print(f"  - Offers: 4 (dave101, eve202, frank303, grace404)")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error adding sample posts: {e}")
        return False


def run_test():
    """Run the test"""
    print("=" * 60)
    print("🧪 GEMINI MATCHER TEST SCRIPT")
    print("=" * 60)
    
    # Add sample posts
    if not add_sample_posts():
        print("\n❌ Failed to add sample posts")
        return
    
    # Run the matcher
    print("\n" + "=" * 60)
    print("🤖 RUNNING MATCHER...")
    print("=" * 60)
    
    from gemini_ingredient_matcher import run_matcher
    run_matcher()


if __name__ == '__main__':
    run_test()

#!/usr/bin/env python3
"""
Gemini-Powered Ingredient Matcher
Uses AI to intelligently match users looking for ingredients with users offering ingredients
"""

import os
import json
from typing import List, Dict, Tuple
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import google.genai as genai

# Load environment variables
load_dotenv()


class CommunityPostsDatabase:
    """Handles MongoDB connection and data retrieval for community posts"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        self.mongo_client = None
        self.db = None
        self.collection = None
        self.setup_mongodb()
    
    def setup_mongodb(self):
        """Set up MongoDB connection to community posts"""
        try:
            connection_string = os.getenv('MONGODB_URI')
            if not connection_string:
                print("❌ MONGODB_URI not found in environment variables")
                return
            
            # Connect to MongoDB
            self.mongo_client = MongoClient(connection_string)
            self.db = self.mongo_client['freshloop_community']
            self.collection = self.db['community_posts']
            
            # Test connection
            self.mongo_client.admin.command('ping')
            print("✅ Connected to MongoDB: freshloop_community.community_posts")
            
            # Print stats
            doc_count = self.collection.count_documents({})
            print(f"📊 Total posts in database: {doc_count}")
            
        except Exception as e:
            print(f"❌ Error connecting to MongoDB: {e}")
            self.mongo_client = None
    
    def get_all_posts(self) -> List[Dict]:
        """Get all community posts from database"""
        if self.collection is None:
            print("❌ Database not connected")
            return []
        
        try:
            posts = list(self.collection.find({}))
            # Convert ObjectId to string for JSON serialization
            for post in posts:
                post['_id'] = str(post['_id'])
            return posts
        except Exception as e:
            print(f"❌ Error retrieving posts: {e}")
            return []
    
    def get_posts_by_type(self, post_type: str) -> List[Dict]:
        """
        Get posts filtered by type
        Args:
            post_type: Either 'request' (looking for) or 'offer' (giving)
        """
        if self.collection is None:
            print("❌ Database not connected")
            return []
        
        try:
            posts = list(self.collection.find({'type': post_type, 'status': 'active'}))
            # Convert ObjectId to string
            for post in posts:
                post['_id'] = str(post['_id'])
            return posts
        except Exception as e:
            print(f"❌ Error retrieving {post_type} posts: {e}")
            return []
    
    def get_request_posts(self) -> List[Dict]:
        """Get all posts where users are looking for ingredients"""
        return self.get_posts_by_type('request')
    
    def get_offer_posts(self) -> List[Dict]:
        """Get all posts where users are offering ingredients"""
        return self.get_posts_by_type('offer')
    
    def close(self):
        """Close MongoDB connection"""
        if self.mongo_client:
            self.mongo_client.close()
            print("✅ MongoDB connection closed")


class GeminiIngredientMatcher:
    """Uses Gemini AI to intelligently match ingredient requests with offers"""
    
    def __init__(self):
        """Initialize Gemini API"""
        self.api_key = os.getenv('GOOGLE_GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("❌ GOOGLE_GEMINI_API_KEY not found in environment variables")
        
        # Configure Gemini using Client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = 'gemini-2.5-flash'
        print("✅ Gemini API initialized")
    
    def extract_ingredients_from_post(self, post: Dict) -> str:
        """Extract ingredient names from a post for matching"""
        ingredients = post.get('ingredients', [])
        
        if not ingredients:
            # Fallback to original text if no parsed ingredients
            return post.get('original_text', '')
        
        # Get ingredient names
        ingredient_names = [
            ing.get('normalized_name', ing.get('name', ''))
            for ing in ingredients
        ]
        
        return ', '.join(ingredient_names)
    
    def match_single_request_with_offers(
        self, 
        request_post: Dict, 
        offer_posts: List[Dict]
    ) -> List[Dict]:
        """
        Use Gemini AI to match a single request with the best offers
        
        Args:
            request_post: Post from user looking for ingredients
            offer_posts: List of posts from users offering ingredients
        
        Returns:
            List of matched offers sorted by relevance
        """
        if not offer_posts:
            return []
        
        request_ingredients = self.extract_ingredients_from_post(request_post)
        request_user = request_post.get('user_id', 'unknown')
        
        # Build prompt for Gemini
        prompt = f"""You are an intelligent ingredient matching system for a food-sharing community.

**User Request:**
User ID: {request_user}
Looking for: {request_ingredients}

**Available Offers:**
"""
        
        # Add each offer to the prompt
        for idx, offer in enumerate(offer_posts):
            offer_ingredients = self.extract_ingredients_from_post(offer)
            offer_user = offer.get('user_id', 'unknown')
            offer_location = offer.get('location', {}).get('description', 'N/A')
            
            prompt += f"""
{idx + 1}. User ID: {offer_user}
   Offering: {offer_ingredients}
   Location: {offer_location}
"""
        
        prompt += """
**Task:**
Analyze which offers best match the request. Consider:
1. Ingredient similarity (exact matches, substitutes, related items)
2. Quantity compatibility
3. Freshness and quality indicators

Return your response as a JSON array with this exact format:
[
  {
    "offer_index": 1,
    "match_score": 95,
    "matched_ingredients": ["tomato", "onion"],
    "reason": "Exact match for tomatoes and onions"
  },
  {
    "offer_index": 3,
    "match_score": 70,
    "matched_ingredients": ["bell pepper"],
    "reason": "Has bell peppers which can substitute for the requested peppers"
  }
]

Rules:
- Only include offers with match_score >= 60
- Sort by match_score (highest first)
- Maximum 5 matches
- Use only valid JSON format
- Only return the JSON array, no other text
"""
        
        try:
            # Call Gemini API
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            response_text = response.text.strip()
            
            # Extract JSON from response
            # Sometimes Gemini wraps JSON in ```json``` blocks
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            # Parse JSON response
            matches = json.loads(response_text)
            
            # Attach full offer data to each match
            enriched_matches = []
            for match in matches:
                offer_idx = match.get('offer_index', 0) - 1  # Convert to 0-based index
                
                if 0 <= offer_idx < len(offer_posts):
                    enriched_match = {
                        'request': {
                            'user_id': request_post.get('user_id'),
                            'ingredients': request_ingredients,
                            'post_id': request_post.get('_id')
                        },
                        'offer': {
                            'user_id': offer_posts[offer_idx].get('user_id'),
                            'ingredients': self.extract_ingredients_from_post(offer_posts[offer_idx]),
                            'location': offer_posts[offer_idx].get('location', {}),
                            'post_id': offer_posts[offer_idx].get('_id')
                        },
                        'match_score': match.get('match_score', 0),
                        'matched_ingredients': match.get('matched_ingredients', []),
                        'reason': match.get('reason', ''),
                        'matched_at': datetime.now().isoformat()
                    }
                    enriched_matches.append(enriched_match)
            
            return enriched_matches
            
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing Gemini response as JSON: {e}")
            print(f"Response: {response_text[:200]}")
            return []
        except Exception as e:
            print(f"❌ Error matching with Gemini: {e}")
            return []
    
    def match_all_requests_with_offers_batch(
        self,
        request_posts: List[Dict],
        offer_posts: List[Dict]
    ) -> Dict[str, List[Dict]]:
        """
        Match all requests with all offers using SINGLE Gemini AI call (FASTEST)
        
        Args:
            request_posts: All posts from users looking for ingredients
            offer_posts: All posts from users offering ingredients
        
        Returns:
            Dictionary mapping request_post_id -> list of matched offers
        """
        if not request_posts or not offer_posts:
            return {req.get('_id'): [] for req in request_posts}
        
        print(f"\n🚀 Batch matching {len(request_posts)} requests with {len(offer_posts)} offers (single API call)...")
        
        # Build comprehensive prompt with all data
        prompt = """You are an intelligent ingredient matching system. Analyze ALL requests and offers below.

**REQUESTS (users looking for ingredients):**
"""
        
        # Add all requests
        request_map = {}  # Map index to request data
        for idx, req in enumerate(request_posts, 1):
            request_id = req.get('_id')
            request_user = req.get('user_id', 'unknown')
            request_ingredients = self.extract_ingredients_from_post(req)
            request_map[idx] = {
                'id': request_id,
                'user_id': request_user,
                'ingredients': request_ingredients,
                'data': req
            }
            prompt += f"{idx}. User: {request_user}, Needs: {request_ingredients}\n"
        
        prompt += "\n**OFFERS (users giving ingredients):**\n"
        
        # Add all offers
        offer_map = {}  # Map index to offer data
        for idx, off in enumerate(offer_posts, 1):
            offer_user = off.get('user_id', 'unknown')
            offer_ingredients = self.extract_ingredients_from_post(off)
            offer_location = off.get('location', {}).get('description', 'N/A')
            offer_map[idx] = {
                'user_id': offer_user,
                'ingredients': offer_ingredients,
                'location': off.get('location', {}),
                'data': off
            }
            prompt += f"{idx}. User: {offer_user}, Has: {offer_ingredients}, Location: {offer_location}\n"
        
        prompt += """\n**Task:**
Match requests with offers. Consider:
1. Ingredient similarity (exact matches, substitutes)
2. Don't match users with themselves
3. Match score 60-100 (only include 60+)

Return JSON in this EXACT format:
{
  "matches": [
    {
      "request_index": 1,
      "offer_index": 2,
      "match_score": 85,
      "matched_ingredients": ["tomato", "onion"],
      "reason": "Exact match for tomatoes and onions"
    }
  ]
}

Rules:
- Only return valid JSON (no other text)
- Only matches with score >= 60
- Don't match same user to themselves
- Be concise in reasons
"""
        
        try:
            # Single Gemini API call for everything
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            response_text = response.text.strip()
            
            # Extract JSON
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            # Parse response
            result = json.loads(response_text)
            matches_list = result.get('matches', [])
            
            print(f"✅ Batch matching complete: {len(matches_list)} matches found")
            
            # Organize by request_id
            all_matches = {req.get('_id'): [] for req in request_posts}
            
            for match in matches_list:
                req_idx = match.get('request_index')
                off_idx = match.get('offer_index')
                
                if req_idx not in request_map or off_idx not in offer_map:
                    continue
                
                req_info = request_map[req_idx]
                off_info = offer_map[off_idx]
                
                # Don't match same user
                if req_info['user_id'] == off_info['user_id']:
                    continue
                
                # Build enriched match
                enriched_match = {
                    'request': {
                        'user_id': req_info['user_id'],
                        'ingredients': req_info['ingredients'],
                        'post_id': req_info['id']
                    },
                    'offer': {
                        'user_id': off_info['user_id'],
                        'ingredients': off_info['ingredients'],
                        'location': off_info['location'],
                        'post_id': off_info['data'].get('_id')
                    },
                    'match_score': match.get('match_score', 0),
                    'matched_ingredients': match.get('matched_ingredients', []),
                    'reason': match.get('reason', ''),
                    'matched_at': datetime.now().isoformat()
                }
                
                all_matches[req_info['id']].append(enriched_match)
            
            # Sort matches by score
            for request_id in all_matches:
                all_matches[request_id].sort(key=lambda x: x['match_score'], reverse=True)
            
            # Print summary
            for req_idx, req_info in request_map.items():
                matches_count = len(all_matches[req_info['id']])
                if matches_count > 0:
                    print(f"  ✅ {req_info['user_id']}: {matches_count} matches")
            
            return all_matches
            
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing batch response: {e}")
            print(f"Response: {response_text[:300]}")
            # Fallback to empty matches
            return {req.get('_id'): [] for req in request_posts}
        except Exception as e:
            print(f"❌ Batch matching error: {e}")
            import traceback
            traceback.print_exc()
            return {req.get('_id'): [] for req in request_posts}
    
    def match_all_requests_with_offers(
        self,
        request_posts: List[Dict],
        offer_posts: List[Dict]
    ) -> Dict[str, List[Dict]]:
        """
        Match all requests with all offers using Gemini AI (sequential mode)
        Note: Use match_all_requests_with_offers_batch for faster performance
        
        Args:
            request_posts: All posts from users looking for ingredients
            offer_posts: All posts from users offering ingredients
        
        Returns:
            Dictionary mapping request_post_id -> list of matched offers
        """
        all_matches = {}
        
        print(f"\n🔍 Matching {len(request_posts)} requests with {len(offer_posts)} offers...")
        
        for idx, request in enumerate(request_posts, 1):
            request_id = request.get('_id')
            request_user = request.get('user_id', 'unknown')
            
            print(f"\n[{idx}/{len(request_posts)}] Processing request from {request_user}...")
            
            # Filter out offers from the same user
            valid_offers = [
                offer for offer in offer_posts 
                if offer.get('user_id') != request_user
            ]
            
            if not valid_offers:
                print(f"  ⚠️  No valid offers available for {request_user}")
                all_matches[request_id] = []
                continue
            
            # Match this request with all offers
            matches = self.match_single_request_with_offers(request, valid_offers)
            all_matches[request_id] = matches
            
            print(f"  ✅ Found {len(matches)} matches for {request_user}")
            for match in matches[:3]:  # Show top 3
                print(f"     - {match['offer']['user_id']}: {match['match_score']}% match")
        
        return all_matches


def run_matcher():
    """Main function to run the ingredient matcher"""
    print("=" * 60)
    print("🔥 GEMINI-POWERED INGREDIENT MATCHER")
    print("=" * 60)
    
    # Initialize database
    db = CommunityPostsDatabase()
    
    if db.collection is None:
        print("❌ Cannot proceed without database connection")
        return
    
    # Get posts from local storage (MongoDB)
    print("\n📥 Retrieving posts from local storage...")
    request_posts = db.get_request_posts()
    offer_posts = db.get_offer_posts()
    
    print(f"✅ Found {len(request_posts)} request posts (users looking for ingredients)")
    print(f"✅ Found {len(offer_posts)} offer posts (users giving ingredients)")
    
    if not request_posts:
        print("\n⚠️  No request posts found. Nothing to match.")
        db.close()
        return
    
    if not offer_posts:
        print("\n⚠️  No offer posts found. Nothing to match.")
        db.close()
        return
    
    # Initialize Gemini matcher
    try:
        matcher = GeminiIngredientMatcher()
    except ValueError as e:
        print(f"❌ {e}")
        db.close()
        return
    
    # Run matching
    print("\n" + "=" * 60)
    print("🤖 RUNNING AI MATCHING...")
    print("=" * 60)
    
    all_matches = matcher.match_all_requests_with_offers(request_posts, offer_posts)
    
    # Display results
    print("\n" + "=" * 60)
    print("📊 MATCHING RESULTS")
    print("=" * 60)
    
    total_matches = sum(len(matches) for matches in all_matches.values())
    print(f"\n✅ Total matches found: {total_matches}")
    
    for request_id, matches in all_matches.items():
        if matches:
            print(f"\n{'─' * 60}")
            print(f"Request ID: {request_id}")
            print(f"Requesting user: {matches[0]['request']['user_id']}")
            print(f"Looking for: {matches[0]['request']['ingredients']}")
            print(f"\nTop matches ({len(matches)}):")
            
            for i, match in enumerate(matches[:5], 1):
                print(f"\n  {i}. Match Score: {match['match_score']}%")
                print(f"     Offering user: {match['offer']['user_id']}")
                print(f"     Offering: {match['offer']['ingredients']}")
                print(f"     Location: {match['offer']['location'].get('description', 'N/A')}")
                print(f"     Matched items: {', '.join(match['matched_ingredients'])}")
                print(f"     Reason: {match['reason']}")
    
    # Save results to JSON file
    output_file = 'ingredient_matches.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_matches, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Results saved to: {output_file}")
    
    # Close database connection
    db.close()
    
    print("\n" + "=" * 60)
    print("✅ MATCHING COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    run_matcher()

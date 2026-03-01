#!/usr/bin/env python3
"""
Flask routes for Gemini-powered ingredient matching
"""

from flask import Blueprint, request, jsonify
from gemini_ingredient_matcher import CommunityPostsDatabase, GeminiIngredientMatcher

# Create Blueprint
gemini_matcher_bp = Blueprint('gemini_matcher', __name__)

# Global instances
db_instance = None
matcher_instance = None


def initialize_matcher():
    """Initialize database and Gemini matcher instances"""
    global db_instance, matcher_instance
    
    try:
        # Try to initialize database (optional now - posts can come from frontend)
        try:
            db_instance = CommunityPostsDatabase()
            print("✅ MongoDB connection available for matcher")
        except Exception as db_error:
            print(f"⚠️  MongoDB not available (optional): {db_error}")
            db_instance = None
        
        # Initialize Gemini matcher (required)
        matcher_instance = GeminiIngredientMatcher()
        print("✅ Gemini Matcher initialized")
    except Exception as e:
        print(f"❌ Error initializing Gemini Matcher: {e}")
        matcher_instance = None


@gemini_matcher_bp.route('/match-ingredients', methods=['POST'])
def match_ingredients():
    """
    Match all requests with offers using AI
    
    Request body (optional):
        {
            "posts": [
                {
                    "_id": "post_id",
                    "user_id": "user123",
                    "type": "request" | "offer",
                    "ingredients": [...],
                    "location": {...},
                    "original_text": "...",
                    "status": "active"
                }
            ]
        }
    
    If posts are provided, use those instead of MongoDB
    
    Returns:
        JSON with all matches organized by request
    """
    global db_instance, matcher_instance
    
    if not matcher_instance:
        return jsonify({
            'success': False,
            'error': 'Matcher not initialized'
        }), 500
    
    try:
        # Check if posts are provided in request body
        data = request.get_json() or {}
        provided_posts = data.get('posts', [])
        
        if provided_posts:
            # Use provided posts from frontend
            print(f"📥 Using {len(provided_posts)} posts from frontend")
            
            # Separate by type
            request_posts = [p for p in provided_posts if p.get('type') == 'request' and p.get('status') == 'active']
            offer_posts = [p for p in provided_posts if p.get('type') == 'offer' and p.get('status') == 'active']
            
            print(f"   - Requests: {len(request_posts)}")
            print(f"   - Offers: {len(offer_posts)}")
        else:
            # Fallback to database if available
            if not db_instance:
                return jsonify({
                    'success': False,
                    'error': 'No posts provided and database not available'
                }), 400
            
            print("📥 Using posts from MongoDB")
            request_posts = db_instance.get_request_posts()
            offer_posts = db_instance.get_offer_posts()
        
        if not request_posts:
            return jsonify({
                'success': True,
                'message': 'No request posts found',
                'matches': {},
                'stats': {
                    'total_requests': 0,
                    'total_offers': len(offer_posts),
                    'total_matches': 0
                }
            })
        
        if not offer_posts:
            return jsonify({
                'success': True,
                'message': 'No offer posts found',
                'matches': {},
                'stats': {
                    'total_requests': len(request_posts),
                    'total_offers': 0,
                    'total_matches': 0
                }
            })
        
        # Run matching
        all_matches = matcher_instance.match_all_requests_with_offers(
            request_posts, 
            offer_posts
        )
        
        # Calculate stats
        total_matches = sum(len(matches) for matches in all_matches.values())
        
        return jsonify({
            'success': True,
            'matches': all_matches,
            'stats': {
                'total_requests': len(request_posts),
                'total_offers': len(offer_posts),
                'total_matches': total_matches,
                'requests_with_matches': sum(1 for m in all_matches.values() if m)
            }
        })
        
    except Exception as e:
        print(f"❌ Error in match_ingredients: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@gemini_matcher_bp.route('/match-single-request', methods=['POST'])
def match_single_request():
    """
    Match a specific request with all available offers
    
    Request body:
        {
            "request_post_id": "post_id_here"
        }
    
    Returns:
        JSON with matches for this specific request
    """
    global db_instance, matcher_instance
    
    if not db_instance or not matcher_instance:
        return jsonify({
            'success': False,
            'error': 'Matcher not initialized'
        }), 500
    
    try:
        data = request.get_json()
        request_post_id = data.get('request_post_id')
        
        if not request_post_id:
            return jsonify({
                'success': False,
                'error': 'request_post_id is required'
            }), 400
        
        # Get the specific request post
        all_requests = db_instance.get_request_posts()
        request_post = next(
            (p for p in all_requests if p.get('_id') == request_post_id),
            None
        )
        
        if not request_post:
            return jsonify({
                'success': False,
                'error': 'Request post not found'
            }), 404
        
        # Get all offer posts
        offer_posts = db_instance.get_offer_posts()
        
        # Filter out offers from same user
        request_user = request_post.get('user_id')
        valid_offers = [
            offer for offer in offer_posts 
            if offer.get('user_id') != request_user
        ]
        
        if not valid_offers:
            return jsonify({
                'success': True,
                'message': 'No offers available',
                'matches': []
            })
        
        # Match
        matches = matcher_instance.match_single_request_with_offers(
            request_post,
            valid_offers
        )
        
        return jsonify({
            'success': True,
            'request_post_id': request_post_id,
            'matches': matches,
            'stats': {
                'total_matches': len(matches),
                'available_offers': len(valid_offers)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@gemini_matcher_bp.route('/matcher-status', methods=['GET'])
def matcher_status():
    """Check if matcher is initialized and get database stats"""
    global db_instance, matcher_instance
    
    if not db_instance or not matcher_instance:
        return jsonify({
            'initialized': False,
            'error': 'Matcher not initialized'
        }), 503
    
    try:
        request_count = len(db_instance.get_request_posts())
        offer_count = len(db_instance.get_offer_posts())
        total_posts = len(db_instance.get_all_posts())
        
        return jsonify({
            'initialized': True,
            'database': 'freshloop_community.community_posts',
            'stats': {
                'total_posts': total_posts,
                'request_posts': request_count,
                'offer_posts': offer_count
            }
        })
        
    except Exception as e:
        return jsonify({
            'initialized': False,
            'error': str(e)
        }), 500

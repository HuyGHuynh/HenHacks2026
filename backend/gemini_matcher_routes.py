#!/usr/bin/env python3
"""
Flask routes for Gemini-powered ingredient matching
Uses frontend localStorage posts only (no MongoDB)
"""

from flask import Blueprint, request, jsonify
from gemini_ingredient_matcher import GeminiIngredientMatcher

# Create Blueprint
gemini_matcher_bp = Blueprint('gemini_matcher', __name__)

# Global instance
matcher_instance = None


def initialize_matcher():
    """Initialize Gemini matcher for frontend localStorage posts"""
    global matcher_instance
    
    try:
        # Initialize Gemini matcher (uses AI to match posts from frontend)
        matcher_instance = GeminiIngredientMatcher()
        print("✅ Gemini Matcher initialized (localStorage mode)")
    except Exception as e:
        print(f"❌ Error initializing Gemini Matcher: {e}")
        matcher_instance = None


@gemini_matcher_bp.route('/match-ingredients', methods=['POST'])
def match_ingredients():
    """
    Match all requests with offers using AI from frontend localStorage
    
    Request body (REQUIRED):
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
    
    Returns:
        JSON with all matches organized by request
    """
    global matcher_instance
    
    if not matcher_instance:
        return jsonify({
            'success': False,
            'error': 'Matcher not initialized'
        }), 500
    
    try:
        # Get posts from request body (frontend localStorage)
        data = request.get_json() or {}
        provided_posts = data.get('posts', [])
        
        if not provided_posts:
            return jsonify({
                'success': False,
                'error': 'No posts provided. Frontend must send posts from localStorage.'
            }), 400
        
        # Use provided posts from frontend localStorage
        print(f"📥 Received {len(provided_posts)} posts from frontend localStorage")
        
        # Separate by type (only active posts)
        request_posts = [p for p in provided_posts if p.get('type') == 'request' and p.get('status') == 'active']
        offer_posts = [p for p in provided_posts if p.get('type') == 'offer' and p.get('status') == 'active']
        
        print(f"   ✓ Requests (looking for): {len(request_posts)}")
        print(f"   ✓ Offers (giving): {len(offer_posts)}")
        
        if not request_posts:
            return jsonify({
                'success': True,
                'message': 'No request posts found in localStorage',
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
                'message': 'No offer posts found in localStorage',
                'matches': {},
                'stats': {
                    'total_requests': len(request_posts),
                    'total_offers': 0,
                    'total_matches': 0
                }
            })
        
        # Run AI matching (BATCH MODE - single API call for speed)
        print(f"🚀 Running Gemini AI batch matching (single call)...")
        import time
        start_time = time.time()
        
        all_matches = matcher_instance.match_all_requests_with_offers_batch(
            request_posts, 
            offer_posts
        )
        
        elapsed = time.time() - start_time
        
        # Calculate stats
        total_matches = sum(len(matches) for matches in all_matches.values())
        
        print(f"✅ Batch matching complete in {elapsed:.2f}s: {total_matches} matches found")
        
        return jsonify({
            'success': True,
            'matches': all_matches,
            'stats': {
                'total_requests': len(request_posts),
                'total_offers': len(offer_posts),
                'total_matches': total_matches,
                'requests_with_matches': sum(1 for m in all_matches.values() if m),
                'processing_time_seconds': round(elapsed, 2),
                'mode': 'batch'
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
    Match a specific request with all available offers from localStorage
    
    Request body:
        {
            "request_post_id": "post_id_here",
            "posts": [all posts from localStorage]
        }
    
    Returns:
        JSON with matches for this specific request
    """
    global matcher_instance
    
    if not matcher_instance:
        return jsonify({
            'success': False,
            'error': 'Matcher not initialized'
        }), 500
    
    try:
        data = request.get_json() or {}
        request_post_id = data.get('request_post_id')
        provided_posts = data.get('posts', [])
        
        if not request_post_id:
            return jsonify({
                'success': False,
                'error': 'request_post_id is required'
            }), 400
        
        if not provided_posts:
            return jsonify({
                'success': False,
                'error': 'posts array required from localStorage'
            }), 400
        
        # Find the specific request post
        request_posts = [p for p in provided_posts if p.get('type') == 'request' and p.get('status') == 'active']
        request_post = next(
            (p for p in request_posts if p.get('_id') == request_post_id),
            None
        )
        
        if not request_post:
            return jsonify({
                'success': False,
                'error': 'Request post not found'
            }), 404
        
        # Get all offer posts
        offer_posts = [p for p in provided_posts if p.get('type') == 'offer' and p.get('status') == 'active']
        
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
    """Check if Gemini matcher is initialized (localStorage mode)"""
    global matcher_instance
    
    if not matcher_instance:
        return jsonify({
            'initialized': False,
            'mode': 'localStorage',
            'error': 'Matcher not initialized'
        }), 503
    
    return jsonify({
        'initialized': True,
        'mode': 'localStorage',
        'message': 'Gemini matcher ready to process posts from frontend'
    })

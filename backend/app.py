from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime, timedelta
from functools import wraps
import jwt
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import io

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = 'swachhta-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///swachhta.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize database
db = SQLAlchemy(app)



@app.route('/api/certificate/download')
@token_required
def download_certificate(current_user):
    if current_user.points < 1000:
        return jsonify({'error': 'Need 1000 points'}), 400
    
    # Create PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    # Design certificate
    p.setFont("Helvetica-Bold", 24)
    p.drawString(100, 700, "SWACHHTA CHAMPION CERTIFICATE")
    p.setFont("Helvetica", 18)
    p.drawString(100, 650, f"Awarded to: {current_user.name}")
    p.drawString(100, 600, f"Green Points: {current_user.points}")
    p.drawString(100, 550, f"Date: {datetime.utcnow().strftime('%Y-%m-%d')}")
    
    p.save()
    buffer.seek(0)
    
    return send_file(buffer, as_attachment=True, 
                    download_name=f"Swachhta_Certificate_{current_user.name}.pdf",
                    mimetype='application/pdf')

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200))
    city = db.Column(db.String(100))
    points = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

class WasteItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    disposal_tip = db.Column(db.String(500))
    warning = db.Column(db.String(200))
    points_value = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Challenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    points = db.Column(db.Integer)
    frequency = db.Column(db.String(20))  # daily, weekly, monthly
    category = db.Column(db.String(50))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'))
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    points_earned = db.Column(db.Integer)

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300))
    icon = db.Column(db.String(50))
    criteria = db.Column(db.String(100))
    points_required = db.Column(db.Integer, default=0)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'))
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

class CleanlinessReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    category = db.Column(db.String(50))
    description = db.Column(db.String(500))
    image_path = db.Column(db.String(200))
    status = db.Column(db.String(20), default='reported')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    activity_type = db.Column(db.String(50))
    description = db.Column(db.String(300))
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CityData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    cleanliness_score = db.Column(db.Integer)
    active_users = db.Column(db.Integer, default=0)
    total_reports = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

# Helper Functions
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(public_id=data['public_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def save_file(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        return unique_filename
    return None

def calculate_user_level(points):
    """Calculate user level based on points"""
    return min(50, (points // 100) + 1)

# Routes
@app.route('/')
def index():
    return jsonify({
        'message': 'Swachhta Citizen Hub API',
        'version': '2.0',
        'status': 'active'
    })


@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'database': 'connected', 
        'version': '2.0.0'
    })
# Auth Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'email', 'password', 'city']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        hashed_password = generate_password_hash(data['password'])
        new_user = User(
            public_id=str(uuid.uuid4()),
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            city=data['city']
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate token
        token = jwt.encode({
            'public_id': new_user.public_id,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'public_id': new_user.public_id,
                'name': new_user.name,
                'email': new_user.email,
                'city': new_user.city,
                'points': new_user.points,
                'streak': new_user.streak,
                'level': new_user.level
            }
        })
        
    except Exception as e:
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid password'}), 401
        
        # Update last activity
        user.last_activity = datetime.utcnow()
        
        # Check and update streak
        today = datetime.utcnow().date()
        last_activity_date = user.last_activity.date()
        
        if last_activity_date != today:
            yesterday = today - timedelta(days=1)
            if last_activity_date == yesterday:
                user.streak += 1
            else:
                user.streak = 1
        
        db.session.commit()
        
        # Generate token
        token = jwt.encode({
            'public_id': user.public_id,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'public_id': user.public_id,
                'name': user.name,
                'email': user.email,
                'city': user.city,
                'points': user.points,
                'streak': user.streak,
                'level': user.level
            }
        })
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

# Waste Identification Routes
@app.route('/api/waste/identify', methods=['POST'])
@token_required
def identify_waste(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('query'):
            return jsonify({'error': 'Query parameter required'}), 400
        
        query = data['query'].lower().strip()
        
        # Search for waste item
        waste_item = WasteItem.query.filter(
            WasteItem.name.ilike(f'%{query}%')
        ).first()
        
        if waste_item:
            # Log activity
            activity = ActivityLog(
                user_id=current_user.id,
                activity_type='waste_identification',
                description=f'Identified {waste_item.name}',
                points=waste_item.points_value
            )
            
            # Add points to user
            current_user.points += waste_item.points_value
            current_user.level = calculate_user_level(current_user.points)
            
            db.session.add(activity)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'item': {
                    'name': waste_item.name,
                    'category': waste_item.category,
                    'disposal_tip': waste_item.disposal_tip,
                    'warning': waste_item.warning,
                    'points': waste_item.points_value
                },
                'points_earned': waste_item.points_value
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Item not found in database'
            }), 404
            
    except Exception as e:
        return jsonify({'error': 'Identification failed', 'details': str(e)}), 500

@app.route('/api/waste/items', methods=['GET'])
def get_waste_items():
    try:
        items = WasteItem.query.all()
        
        return jsonify({
            'success': True,
            'items': [{
                'id': item.id,
                'name': item.name,
                'category': item.category,
                'disposal_tip': item.disposal_tip,
                'warning': item.warning,
                'points_value': item.points_value
            } for item in items]
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch waste items', 'details': str(e)}), 500

# Challenge Routes
@app.route('/api/challenges', methods=['GET'])
@token_required
def get_challenges(current_user):
    try:
        challenges = Challenge.query.filter_by(active=True).all()
        
        # Get user's completed challenges
        user_completions = UserChallenge.query.filter_by(user_id=current_user.id).all()
        completed_ids = [uc.challenge_id for uc in user_completions]
        
        challenges_data = []
        for challenge in challenges:
            challenges_data.append({
                'id': challenge.id,
                'name': challenge.name,
                'description': challenge.description,
                'points': challenge.points,
                'frequency': challenge.frequency,
                'category': challenge.category,
                'completed': challenge.id in completed_ids
            })
        
        return jsonify({
            'success': True,
            'challenges': challenges_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch challenges', 'details': str(e)}), 500

@app.route('/api/challenges/complete', methods=['POST'])
@token_required
def complete_challenge(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('challenge_id'):
            return jsonify({'error': 'Challenge ID required'}), 400
        
        challenge = Challenge.query.get(data['challenge_id'])
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        # Check if already completed today for daily challenges
        if challenge.frequency == 'daily':
            today = datetime.utcnow().date()
            existing = UserChallenge.query.filter(
                UserChallenge.user_id == current_user.id,
                UserChallenge.challenge_id == challenge.id,
                db.func.date(UserChallenge.completed_at) == today
            ).first()
            
            if existing:
                return jsonify({'error': 'Challenge already completed today'}), 400
        
        # Record completion
        user_challenge = UserChallenge(
            user_id=current_user.id,
            challenge_id=challenge.id,
            points_earned=challenge.points
        )
        
        # Add points to user
        current_user.points += challenge.points
        current_user.level = calculate_user_level(current_user.points)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user.id,
            activity_type='challenge_completed',
            description=f'Completed challenge: {challenge.name}',
            points=challenge.points
        )
        
        db.session.add(user_challenge)
        db.session.add(activity)
        db.session.commit()
        
        # Check for badge achievements
        check_badge_achievements(current_user.id)
        
        return jsonify({
            'success': True,
            'points_earned': challenge.points,
            'total_points': current_user.points
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to complete challenge', 'details': str(e)}), 500

# Badge Routes
@app.route('/api/badges', methods=['GET'])
@token_required
def get_badges(current_user):
    try:
        badges = Badge.query.all()
        user_badges = UserBadge.query.filter_by(user_id=current_user.id).all()
        earned_badge_ids = [ub.badge_id for ub in user_badges]
        
        badges_data = []
        for badge in badges:
            badges_data.append({
                'id': badge.id,
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon,
                'criteria': badge.criteria,
                'points_required': badge.points_required,
                'earned': badge.id in earned_badge_ids
            })
        
        return jsonify({
            'success': True,
            'badges': badges_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch badges', 'details': str(e)}), 500

def check_badge_achievements(user_id):
    """Check and award badges based on user achievements"""
    user = User.query.get(user_id)
    if not user:
        return
    
    # Check point-based badges
    point_badges = Badge.query.filter(Badge.criteria.like('points:%')).all()
    for badge in point_badges:
        required_points = int(badge.criteria.split(':')[1])
        if user.points >= required_points:
            award_badge(user_id, badge.id)
    
    # Check streak badges
    streak_badges = Badge.query.filter(Badge.criteria.like('streak:%')).all()
    for badge in streak_badges:
        required_streak = int(badge.criteria.split(':')[1])
        if user.streak >= required_streak:
            award_badge(user_id, badge.id)
    
    # Check challenge completion badges
    challenge_badges = Badge.query.filter(Badge.criteria.like('challenges:%')).all()
    completed_challenges = UserChallenge.query.filter_by(user_id=user_id).count()
    for badge in challenge_badges:
        required_challenges = int(badge.criteria.split(':')[1])
        if completed_challenges >= required_challenges:
            award_badge(user_id, badge.id)

def award_badge(user_id, badge_id):
    """Award a badge to a user if not already earned"""
    existing = UserBadge.query.filter_by(
        user_id=user_id,
        badge_id=badge_id
    ).first()
    
    if not existing:
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        db.session.add(user_badge)
        db.session.commit()

# Leaderboard Routes
@app.route('/api/leaderboard/cities', methods=['GET'])
def get_city_leaderboard():
    try:
        cities = CityData.query.order_by(CityData.cleanliness_score.desc()).limit(20).all()
        
        leaderboard_data = []
        for i, city in enumerate(cities):
            leaderboard_data.append({
                'rank': i + 1,
                'name': city.name,
                'state': city.state,
                'cleanliness_score': city.cleanliness_score,
                'active_users': city.active_users,
                'total_reports': city.total_reports
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch leaderboard', 'details': str(e)}), 500

@app.route('/api/leaderboard/users', methods=['GET'])
def get_user_leaderboard():
    try:
        users = User.query.order_by(User.points.desc()).limit(50).all()
        
        leaderboard_data = []
        for i, user in enumerate(users):
            leaderboard_data.append({
                'rank': i + 1,
                'name': user.name,
                'city': user.city,
                'points': user.points,
                'level': user.level,
                'streak': user.streak
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch leaderboard', 'details': str(e)}), 500

# Report Routes
@app.route('/api/reports', methods=['POST'])
@token_required
def create_report(current_user):
    try:
        data = request.form
        
        # Handle file upload
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            image_path = save_file(file)
        
        report = CleanlinessReport(
            user_id=current_user.id,
            latitude=float(data.get('latitude', 0)),
            longitude=float(data.get('longitude', 0)),
            category=data.get('category', 'other'),
            description=data.get('description', ''),
            image_path=image_path
        )
        
        # Add points for reporting
        points_earned = 15
        current_user.points += points_earned
        current_user.level = calculate_user_level(current_user.points)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user.id,
            activity_type='cleanliness_report',
            description='Reported cleanliness issue',
            points=points_earned
        )
        
        db.session.add(report)
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'report_id': report.id,
            'points_earned': points_earned
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to create report', 'details': str(e)}), 500

# Activity Routes
@app.route('/api/activities', methods=['GET'])
@token_required
def get_activities(current_user):
    try:
        activities = ActivityLog.query.filter_by(user_id=current_user.id)\
            .order_by(ActivityLog.created_at.desc())\
            .limit(20).all()
        
        activities_data = []
        for activity in activities:
            activities_data.append({
                'id': activity.id,
                'type': activity.activity_type,
                'description': activity.description,
                'points': activity.points,
                'created_at': activity.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'activities': activities_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch activities', 'details': str(e)}), 500

# Heatmap Data Route
@app.route('/api/heatmap', methods=['GET'])
def get_heatmap_data():
    try:
        cities = CityData.query.all()
        
        heatmap_data = []
        for city in cities:
            # Convert score to weight (0-1)
            weight = city.cleanliness_score / 100
            heatmap_data.append({
                'lat': city.latitude,
                'lng': city.longitude,
                'weight': weight,
                'name': city.name,
                'score': city.cleanliness_score
            })
        
        return jsonify({
            'success': True,
            'heatmap_data': heatmap_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch heatmap data', 'details': str(e)}), 500

# User Profile Routes
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        # Get user stats
        completed_challenges = UserChallenge.query.filter_by(user_id=current_user.id).count()
        earned_badges = UserBadge.query.filter_by(user_id=current_user.id).count()
        reports_submitted = CleanlinessReport.query.filter_by(user_id=current_user.id).count()
        
        return jsonify({
            'success': True,
            'profile': {
                'public_id': current_user.public_id,
                'name': current_user.name,
                'email': current_user.email,
                'city': current_user.city,
                'points': current_user.points,
                'streak': current_user.streak,
                'level': current_user.level,
                'created_at': current_user.created_at.isoformat(),
                'stats': {
                    'completed_challenges': completed_challenges,
                    'earned_badges': earned_badges,
                    'reports_submitted': reports_submitted
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch profile', 'details': str(e)}), 500

# Certificate Route
@app.route('/api/certificate', methods=['GET'])
@token_required
def get_certificate(current_user):
    try:
        if current_user.points < 1000:
            return jsonify({
                'success': False,
                'message': 'Need 1000 points to unlock certificate'
            }), 400
        
        certificate_data = {
            'user_name': current_user.name,
            'user_city': current_user.city,
            'points_earned': current_user.points,
            'level_achieved': current_user.level,
            'issue_date': datetime.utcnow().isoformat(),
            'certificate_id': f"SWACHHTA-{current_user.public_id}-{int(datetime.utcnow().timestamp())}"
        }
        
        return jsonify({
            'success': True,
            'certificate': certificate_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate certificate', 'details': str(e)}), 500

# Initialize Database and Sample Data
def init_db():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Add sample waste items
        if WasteItem.query.count() == 0:
            sample_waste = [
                {"name": "banana peel", "category": "wet", "disposal_tip": "Compost if possible. Great for making organic fertilizer.", "warning": None, "points_value": 5},
                {"name": "plastic bottle", "category": "dry", "disposal_tip": "Rinse and recycle. Check local recycling guidelines for plastic type.", "warning": "Remove caps and labels first", "points_value": 10},
                {"name": "battery", "category": "hazardous", "disposal_tip": "Take to authorized collection center. Never throw in regular trash.", "warning": "Contains toxic chemicals - handle with care", "points_value": 15},
                {"name": "mobile phone", "category": "e-waste", "disposal_tip": "Take to e-waste recycling center. Consider donating if still working.", "warning": "Contains valuable and hazardous materials", "points_value": 20},
                {"name": "newspaper", "category": "dry", "disposal_tip": "Recycle with paper products. Can also be used for composting or packing material.", "warning": None, "points_value": 5}
            ]
            
            for item in sample_waste:
                db.session.add(WasteItem(**item))
            
        # Add real waste data
@app.route('/api/waste/add', methods=['POST'])
def add_waste_item():
    data = request.json
    new_item = WasteItem(
        name=data['name'],
        category=data['category'], 
        disposal_tip=data['tip'],
        warning=data.get('warning'),
        points_value=data.get('points', 5)
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({'success': True})

# Add real city data
@app.route('/api/cities/update', methods=['POST'])  
def update_city_data():
    data = request.json
    city = CityData.query.filter_by(name=data['name']).first()
    if city:
        city.cleanliness_score = data['score']
        city.active_users = data['users']
        city.total_reports = data['reports']
    db.session.commit()
    return jsonify({'success': True})
        
        # Add sample challenges
if Challenge.query.count() == 0:
            sample_challenges = [
                {"name": "Plastic-Free Day", "description": "Avoid using any single-use plastic items for the entire day", "points": 50, "frequency": "daily", "category": "plastic_reduction"},
                {"name": "Kitchen Waste Segregation", "description": "Properly separate all kitchen waste into wet and dry categories", "points": 30, "frequency": "daily", "category": "segregation"},
                {"name": "Clean Your Galli", "description": "Organize or participate in cleaning your street/neighborhood", "points": 100, "frequency": "weekly", "category": "community"}
            ]
            
            for challenge in sample_challenges:
                db.session.add(Challenge(**challenge))
        
        # Add sample badges
if Badge.query.count() == 0:
            sample_badges = [
                {"name": "Green Beginner", "description": "Completed your first challenge", "icon": "fa-seedling", "criteria": "challenges:1", "points_required": 0},
                {"name": "Waste Warrior", "description": "Properly sorted 50 items", "icon": "fa-shield-alt", "criteria": "points:500", "points_required": 500},
                {"name": "Eco Champion", "description": "Reached 1000 Green Points", "icon": "fa-trophy", "criteria": "points:1000", "points_required": 1000},
                {"name": "7-Day Streak", "description": "Maintained 7-day activity streak", "icon": "fa-fire", "criteria": "streak:7", "points_required": 0}
            ]
            
            for badge in sample_badges:
                db.session.add(Badge(**badge))
        
        # Add sample city data
if CityData.query.count() == 0:
            sample_cities = [
                {"name": "Mumbai", "state": "Maharashtra", "latitude": 19.0760, "longitude": 72.8777, "cleanliness_score": 85, "active_users": 12500, "total_reports": 342},
                {"name": "Pune", "state": "Maharashtra", "latitude": 18.5204, "longitude": 73.8567, "cleanliness_score": 92, "active_users": 9800, "total_reports": 215},
                {"name": "Nagpur", "state": "Maharashtra", "latitude": 21.1458, "longitude": 79.0882, "cleanliness_score": 78, "active_users": 5200, "total_reports": 187}
            ]
            
            for city in sample_cities:
                db.session.add(CityData(**city))
        
db.session.commit()

# Create uploads directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize database on startup
init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
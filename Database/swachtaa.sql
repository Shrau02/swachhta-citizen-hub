-- SQL Schema for Swachhta Citizen Hub Database

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Waste items database
CREATE TABLE waste_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    disposal_tip TEXT,
    warning VARCHAR(200),
    points_value INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Challenges
CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    frequency VARCHAR(20), -- daily, weekly, monthly
    category VARCHAR(50),
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User challenge completions
CREATE TABLE user_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    challenge_id INTEGER REFERENCES challenges(id),
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER,
    UNIQUE(user_id, challenge_id, DATE(completed_at))
);

-- Badges system
CREATE TABLE badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    criteria VARCHAR(100),
    points_required INTEGER DEFAULT 0
);

-- User badges
CREATE TABLE user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    badge_id INTEGER REFERENCES badges(id),
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Cleanliness reports
CREATE TABLE cleanliness_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    latitude FLOAT,
    longitude FLOAT,
    category VARCHAR(50),
    description TEXT,
    image_path VARCHAR(200),
    status VARCHAR(20) DEFAULT 'reported',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity logging
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50),
    description TEXT,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- City data for heatmap
CREATE TABLE city_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    cleanliness_score INTEGER,
    active_users INTEGER DEFAULT 0,
    total_reports INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_user_points ON users(points);
CREATE INDEX idx_user_streak ON users(streak);
CREATE INDEX idx_challenge_frequency ON challenges(frequency);
CREATE INDEX idx_challenge_active ON challenges(active);
CREATE INDEX idx_user_challenges_completion ON user_challenges(user_id, completed_at);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at);
CREATE INDEX idx_reports_location ON cleanliness_reports(latitude, longitude);
CREATE INDEX idx_city_scores ON city_data(cleanliness_score);

-- Insert sample data
INSERT INTO waste_items (name, category, disposal_tip, warning, points_value) VALUES
('banana peel', 'wet', 'Compost if possible. Great for making organic fertilizer.', NULL, 5),
('plastic bottle', 'dry', 'Rinse and recycle. Check local recycling guidelines for plastic type.', 'Remove caps and labels first', 10),
('battery', 'hazardous', 'Take to authorized collection center. Never throw in regular trash.', 'Contains toxic chemicals - handle with care', 15);

INSERT INTO challenges (name, description, points, frequency, category) VALUES
('Plastic-Free Day', 'Avoid using any single-use plastic items for the entire day', 50, 'daily', 'plastic_reduction'),
('Kitchen Waste Segregation', 'Properly separate all kitchen waste into wet and dry categories', 30, 'daily', 'segregation'),
('Clean Your Galli', 'Organize or participate in cleaning your street/neighborhood', 100, 'weekly', 'community');

INSERT INTO badges (name, description, icon, criteria, points_required) VALUES
('Green Beginner', 'Completed your first challenge', 'fa-seedling', 'challenges:1', 0),
('Waste Warrior', 'Properly sorted 50 items', 'fa-shield-alt', 'points:500', 500),
('Eco Champion', 'Reached 1000 Green Points', 'fa-trophy', 'points:1000', 1000);

INSERT INTO city_data (name, state, latitude, longitude, cleanliness_score, active_users, total_reports) VALUES
('Mumbai', 'Maharashtra', 19.0760, 72.8777, 85, 12500, 342),
('Pune', 'Maharashtra', 18.5204, 73.8567, 92, 9800, 215),
('Nagpur', 'Maharashtra', 21.1458, 79.0882, 78, 5200, 187);
#!/bin/bash
pip install reportlab

# Swachhta Citizen Hub Deployment Script
echo "🚀 Starting Swachhta Citizen Hub Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required commands are available
check_dependencies() {
    local deps=("git" "node" "npm" "python3")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            print_error "$dep is not installed. Please install it first."
            exit 1
        fi
    done
    print_status "All dependencies are available."
}

# Backup existing database
backup_database() {
    if [ -f "swachhta.db" ]; then
        print_status "Backing up existing database..."
        cp swachhta.db "swachhta.db.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "Database backup created."
    fi
}

# Install Python dependencies
setup_python_backend() {
    print_status "Setting up Python backend..."
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        pip install flask flask-sqlalchemy flask-cors pyjwt bcrypt werkzeug
    fi
    
    print_status "Python backend setup complete."
}

# Install Node.js dependencies
setup_node_frontend() {
    print_status "Setting up Node.js frontend..."
    
    if [ -f "package.json" ]; then
        npm install
        npm run build
    fi
    
    print_status "Node.js frontend setup complete."
}

# Initialize database
initialize_database() {
    print_status "Initializing database..."
    
    source venv/bin/activate
    python3 -c "
from app import init_db
init_db()
print('Database initialized successfully.')
    "
    
    print_status "Database initialization complete."
}

# Setup nginx configuration (for production)
setup_nginx() {
    if [ "$1" == "production" ] && [ -x "$(command -v nginx)" ]; then
        print_status "Setting up nginx configuration..."
        
        sudo bash -c 'cat > /etc/nginx/sites-available/swachhta << EOF
server {
    listen 80;
    server_name swachhtacitizenhub.in www.swachhtacitizenhub.in;
    
    root /var/www/swachhta;
    index index.html;
    
    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
    
    # Static files
    location /static {
        alias /var/www/swachhta/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF'
        
        sudo ln -sf /etc/nginx/sites-available/swachhta /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        
        print_status "Nginx configuration complete."
    fi
}

# Setup systemd service (for production)
setup_systemd() {
    if [ "$1" == "production" ]; then
        print_status "Setting up systemd service..."
        
        sudo bash -c 'cat > /etc/systemd/system/swachhta.service << EOF
[Unit]
Description=Swachhta Citizen Hub Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/swachhta
Environment=PATH=/var/www/swachhta/venv/bin
ExecStart=/var/www/swachhta/venv/bin/python app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'
        
        sudo systemctl daemon-reload
        sudo systemctl enable swachhta.service
        sudo systemctl start swachhta.service
        
        print_status "Systemd service setup complete."
    fi
}

# Main deployment function
deploy() {
    local environment=${1:-development}
    
    print_status "Starting deployment for $environment environment..."
    
    # Check dependencies
    check_dependencies
    
    # Backup database
    backup_database
    
    # Setup backend
    setup_python_backend

    #download the certificate
  
    
    # Setup frontend
    setup_node_frontend
    
    # Initialize database
    initialize_database
    
    # Production-specific setup
    if [ "$environment" == "production" ]; then
        setup_nginx production
        setup_systemd production
        
        # Set proper permissions
        sudo chown -R www-data:www-data .
        sudo chmod -R 755 .
    fi
    
    print_status "🎉 Swachhta Citizen Hub deployment completed successfully!"
    print_status "🌐 Frontend: http://localhost:3000"
    print_status "🔧 Backend API: http://localhost:5000"
    
    if [ "$environment" == "production" ]; then
        print_status "📊 Check service status: sudo systemctl status swachhta"
        print_status "📋 View logs: sudo journalctl -u swachhta -f"
    fi
}

# Run deployment
if [ $# -eq 0 ]; then
    deploy "development"
else
    deploy "$1"
fi
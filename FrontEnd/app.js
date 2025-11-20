// Swachhta Citizen Hub - Main Application JavaScript
class SwachhtaApp {
    constructor() {
        this.currentUser = null;
        this.userPoints = 1250;
        this.userStreak = 12;
        this.userRank = 1247;
        this.gameActive = false;
        this.gameScore = 0;
        this.gameStreak = 0;
        this.gameTimeLeft = 60;
        this.gameTimer = null;
        this.chatbotOpen = false;
        
        this.init();
    }

    init() {
        this.initializeTheme();
        this.initializeNavigation();
        this.initializeHeatmap();
        this.initializeWasteIdentifier();
        this.initializeGame();
        this.initializeChatbot();
        this.initializeModals();
        this.loadUserData();
        this.loadChallenges();
        this.loadLeaderboard();
        this.loadAwarenessContent();
        this.checkCertificateEligibility();
        this.loadActivityFeed();
        
        console.log('Swachhta Citizen Hub initialized successfully!');
    }

    // Theme Management
    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('swachhta-theme') || 'light';
        
        document.body.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            themeToggle.innerHTML = newTheme === 'dark' ? 
                '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            
            localStorage.setItem('swachhta-theme', newTheme);
            this.showToast('Theme changed to ' + newTheme + ' mode', 'success');
        });
    }

    // Navigation System
    initializeNavigation() {
        // Page navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.page) {
                btn.addEventListener('click', () => {
                    this.navigateToPage(btn.dataset.page);
                });
            }
        });

        // Quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            if (card.dataset.page) {
                card.addEventListener('click', () => {
                    this.navigateToPage(card.dataset.page);
                });
            }
        });

        // Report issue button
        document.getElementById('reportIssueBtn').addEventListener('click', () => {
            this.openReportModal();
        });

        document.getElementById('quickReportBtn').addEventListener('click', () => {
            this.openReportModal();
        });
    }

    navigateToPage(pageId) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === pageId) {
                btn.classList.add('active');
            }
        });

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Initialize page-specific components
            this.initializePageComponents(pageId);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    initializePageComponents(pageId) {
        switch (pageId) {
            case 'home':
                this.initializeHeatmap();
                break;
            case 'waste':
                this.initializeWasteIdentifier();
                this.initializeGame();
                break;
            case 'challenges':
                this.loadChallenges();
                this.loadBadges();
                this.loadRewards();
                break;
            case 'leaderboard':
                this.loadLeaderboard();
                this.loadUserStats();
                break;
            case 'awareness':
                this.loadAwarenessContent();
                break;
            case 'profile':
                this.loadProfileData();
                this.initializeCharts();
                break;
        }
    }

    // Heatmap with Google Maps Integration
    initializeHeatmap() {
        const mapElement = document.getElementById('heatmap');
        if (!mapElement) return;

        // Maharashtra cities data with cleanliness scores
        const citiesData = {
            all: [
                { name: "Mumbai", lat: 19.0760, lng: 72.8777, score: 85, users: 12500, reports: 342 },
                { name: "Pune", lat: 18.5204, lng: 73.8567, score: 92, users: 9800, reports: 215 },
                { name: "Nagpur", lat: 21.1458, lng: 79.0882, score: 78, users: 5200, reports: 187 },
                { name: "Nashik", lat: 20.0059, lng: 73.7910, score: 82, users: 4100, reports: 156 },
                { name: "Aurangabad", lat: 19.8762, lng: 75.3433, score: 65, users: 3200, reports: 234 },
                { name: "Solapur", lat: 17.6599, lng: 75.9064, score: 58, users: 2800, reports: 198 },
                { name: "Kolhapur", lat: 16.7050, lng: 74.2433, score: 88, users: 3500, reports: 123 },
                { name: "Amravati", lat: 20.9374, lng: 77.7796, score: 72, users: 2100, reports: 145 },
                { name: "Nanded", lat: 19.1383, lng: 77.3210, score: 63, users: 1900, reports: 167 },
                { name: "Sangli", lat: 16.8524, lng: 74.5815, score: 79, users: 1800, reports: 98 }
            ],
            excellent: [
                { name: "Pune", lat: 18.5204, lng: 73.8567, score: 92, users: 9800, reports: 215 },
                { name: "Kolhapur", lat: 16.7050, lng: 74.2433, score: 88, users: 3500, reports: 123 },
                { name: "Mumbai", lat: 19.0760, lng: 72.8777, score: 85, users: 12500, reports: 342 }
            ],
            good: [
                { name: "Nashik", lat: 20.0059, lng: 73.7910, score: 82, users: 4100, reports: 156 },
                { name: "Sangli", lat: 16.8524, lng: 74.5815, score: 79, users: 1800, reports: 98 },
                { name: "Nagpur", lat: 21.1458, lng: 79.0882, score: 78, users: 5200, reports: 187 }
            ],
            "needs-improvement": [
                { name: "Amravati", lat: 20.9374, lng: 77.7796, score: 72, users: 2100, reports: 145 },
                { name: "Aurangabad", lat: 19.8762, lng: 75.3433, score: 65, users: 3200, reports: 234 },
                { name: "Nanded", lat: 19.1383, lng: 77.3210, score: 63, users: 1900, reports: 167 }
            ],
            critical: [
                { name: "Solapur", lat: 17.6599, lng: 75.9064, score: 58, users: 2800, reports: 198 }
            ]
        };

        // Initialize Google Maps
        const map = new google.maps.Map(mapElement, {
            zoom: 6,
            center: { lat: 19.7515, lng: 75.7139 },
            mapTypeId: 'roadmap',
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        });

        let heatmap = new google.maps.visualization.HeatmapLayer({
            data: [],
            map: map,
            radius: 30,
            opacity: 0.6
        });

        let markers = [];
        let currentLayer = 'all';

        function updateMap(layer) {
            // Clear existing markers
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            currentLayer = layer;
            const data = citiesData[layer] || [];
            const heatmapData = [];

            data.forEach(city => {
                // Create marker
                const marker = new google.maps.Marker({
                    position: { lat: city.lat, lng: city.lng },
                    map: map,
                    title: city.name,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: Math.max(city.users / 800, 8),
                        fillColor: getColorForScore(city.score),
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });

                // Create info window
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="map-info-window">
                            <h3>${city.name}</h3>
                            <div class="map-stats">
                                <div class="map-stat">
                                    <span class="stat-label">Cleanliness Score:</span>
                                    <span class="stat-value ${getScoreClass(city.score)}">${city.score}/100</span>
                                </div>
                                <div class="map-stat">
                                    <span class="stat-label">Active Users:</span>
                                    <span class="stat-value">${city.users.toLocaleString()}</span>
                                </div>
                                <div class="map-stat">
                                    <span class="stat-label">Reports Resolved:</span>
                                    <span class="stat-value">${city.reports}</span>
                                </div>
                                <div class="map-stat">
                                    <span class="stat-label">Status:</span>
                                    <span class="stat-value ${getScoreClass(city.score)}">${getStatusForScore(city.score)}</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-accent" onclick="app.showToast('Reporting feature for ${city.name} would open here', 'info')">
                                <i class="fas fa-flag"></i> Report Issue
                            </button>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                markers.push(marker);

                // Add to heatmap data
                heatmapData.push({
                    location: new google.maps.LatLng(city.lat, city.lng),
                    weight: city.score / 100
                });
            });

            // Update heatmap
            heatmap.setData(heatmapData);
            updateStats(layer);
        }

        function getColorForScore(score) {
            if (score >= 80) return '#00FF00';
            if (score >= 60) return '#FFFF00';
            if (score >= 40) return '#FF8000';
            return '#FF0000';
        }

        function getStatusForScore(score) {
            if (score >= 80) return 'Excellent';
            if (score >= 60) return 'Good';
            if (score >= 40) return 'Needs Improvement';
            return 'Critical';
        }

        function getScoreClass(score) {
            if (score >= 80) return 'score-excellent';
            if (score >= 60) return 'score-good';
            if (score >= 40) return 'score-average';
            return 'score-poor';
        }

        function updateStats(layer) {
            const statsContainer = document.getElementById('stats-container');
            const data = citiesData[layer] || [];
            
            const totalCities = data.length;
            const avgScore = data.length > 0 ? (data.reduce((sum, city) => sum + city.score, 0)) / totalCities : 0;
            const totalUsers = data.reduce((sum, city) => sum + city.users, 0);
            const totalReports = data.reduce((sum, city) => sum + city.reports, 0);
            const excellentCities = data.filter(city => city.score >= 80).length;

            statsContainer.innerHTML = `
                <div class="stat-card mini">
                    <div class="stat-icon">
                        <i class="fas fa-city"></i>
                    </div>
                    <span class="stat-number">${totalCities}</span>
                    <span class="stat-label">Cities Tracked</span>
                </div>
                <div class="stat-card mini">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <span class="stat-number">${avgScore.toFixed(1)}</span>
                    <span class="stat-label">Average Score</span>
                </div>
                <div class="stat-card mini">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <span class="stat-number">${totalUsers.toLocaleString()}</span>
                    <span class="stat-label">Active Users</span>
                </div>
                <div class="stat-card mini">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <span class="stat-number">${excellentCities}</span>
                    <span class="stat-label">Excellent Cities</span>
                </div>
            `;
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateMap(this.dataset.layer);
            });
        });

        // Initial load
        updateMap('all');

        // Add CSS for map info windows
        const style = document.createElement('style');
        style.textContent = `
            .map-info-window {
                padding: 10px;
                min-width: 200px;
            }
            .map-info-window h3 {
                margin: 0 0 10px 0;
                color: var(--primary-green);
                border-bottom: 2px solid var(--light-gray);
                padding-bottom: 5px;
            }
            .map-stats {
                margin-bottom: 10px;
            }
            .map-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.9rem;
            }
            .stat-label {
                font-weight: 600;
            }
            .stat-value {
                font-weight: 600;
            }
            .score-excellent { color: #00FF00; }
            .score-good { color: #FFFF00; }
            .score-average { color: #FF8000; }
            .score-poor { color: #FF0000; }
            .btn-sm {
                padding: 5px 10px;
                font-size: 0.8rem;
            }
        `;
        document.head.appendChild(style);
    }

    // Waste Identification System
    initializeWasteIdentifier() {
        const wasteSearch = document.getElementById('wasteSearch');
        const searchBtn = document.getElementById('searchBtn');
        const wasteResult = document.getElementById('wasteResult');
        const imageUpload = document.getElementById('imageUpload');
        const fileInput = document.getElementById('fileInput');
        const uploadPreview = document.getElementById('uploadPreview');

        // Search functionality
        searchBtn.addEventListener('click', () => this.searchWaste());
        wasteSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWaste();
        });

        // Suggestion tags
        document.querySelectorAll('.suggestion-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                wasteSearch.value = tag.textContent;
                this.searchWaste();
            });
        });

        // Image upload functionality
        imageUpload.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Drag and drop for image upload
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            imageUpload.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            imageUpload.addEventListener(eventName, () => this.highlight(imageUpload), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            imageUpload.addEventListener(eventName, () => this.unhighlight(imageUpload), false);
        });

        imageUpload.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            this.handleImageUpload(e);
        });
    }

    searchWaste() {
        const query = document.getElementById('wasteSearch').value.trim().toLowerCase();
        const wasteResult = document.getElementById('wasteResult');
        
        if (!query) {
            this.showToast('Please enter a waste item to identify', 'warning');
            return;
        }

        // Show loading
        wasteResult.className = 'waste-result';
        wasteResult.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Identifying waste item...</p></div>';

        // Simulate API call with timeout
        setTimeout(() => {
            const wasteDatabase = {
                // Wet Waste
                "banana peel": { category: "wet", name: "Banana Peel", tip: "Compost if possible. Great for making organic fertilizer.", points: 5, warning: null },
                "apple core": { category: "wet", name: "Apple Core", tip: "Compostable. Remove any stickers before composting.", points: 5, warning: null },
                "vegetable scraps": { category: "wet", name: "Vegetable Scraps", tip: "Perfect for composting. Can be used to make vegetable stock first.", points: 5, warning: null },
                "eggshells": { category: "wet", name: "Egg Shells", tip: "Crush and add to compost. Rich in calcium for plants.", points: 5, warning: null },
                "tea leaves": { category: "wet", name: "Tea Leaves", tip: "Compostable. Can also be used directly in garden as fertilizer.", points: 5, warning: null },
                "coffee grounds": { category: "wet", name: "Coffee Grounds", tip: "Excellent for composting. Acid-loving plants like roses love coffee grounds.", points: 5, warning: null },

                // Dry Waste
                "plastic bottle": { category: "dry", name: "Plastic Bottle", tip: "Rinse and recycle. Check local recycling guidelines for plastic type.", points: 10, warning: "Remove caps and labels first" },
                "newspaper": { category: "dry", name: "Newspaper", tip: "Recycle with paper products. Can also be used for composting or packing material.", points: 5, warning: null },
                "cardboard": { category: "dry", name: "Cardboard", tip: "Flatten and recycle. Remove any tape or plastic wrapping.", points: 5, warning: null },
                "metal can": { category: "dry", name: "Metal Can", tip: "Rinse and recycle. Separate steel and aluminum if possible.", points: 10, warning: "Watch for sharp edges" },

                // Hazardous Waste
                "battery": { category: "hazardous", name: "Battery", tip: "Take to authorized collection center. Never throw in regular trash.", points: 15, warning: "Contains toxic chemicals - handle with care" },
                "medicine": { category: "hazardous", name: "Medicine", tip: "Return to pharmacy or designated collection point. Don't flush down toilet.", points: 15, warning: "Can contaminate water supply" },
                "thermometer": { category: "hazardous", name: "Thermometer", tip: "Special disposal required for mercury content. Contact local hazardous waste facility.", points: 20, warning: "Contains mercury - extremely hazardous" },
                "paint": { category: "hazardous", name: "Paint", tip: "Take to hazardous waste facility. Dry out latex paint before disposal.", points: 15, warning: "Flammable and toxic" },

                // E-Waste
                "mobile phone": { category: "e-waste", name: "Mobile Phone", tip: "Take to e-waste recycling center. Consider donating if still working.", points: 20, warning: "Contains valuable and hazardous materials" },
                "laptop": { category: "e-waste", name: "Laptop", tip: "Professional e-waste recycling required. Wipe data before disposal.", points: 25, warning: "Data security and hazardous materials" },
                "charger": { category: "e-waste", name: "Charger", tip: "E-waste recycling. Don't throw in regular trash.", points: 10, warning: "Contains copper and other recyclables" }
            };

            // Find matching item
            let foundItem = null;
            for (const [key, value] of Object.entries(wasteDatabase)) {
                if (query.includes(key) || key.includes(query)) {
                    foundItem = value;
                    break;
                }
            }

            if (foundItem) {
                wasteResult.className = `waste-result show ${foundItem.category}-waste`;
                wasteResult.innerHTML = `
                    <h3>${foundItem.name}</h3>
                    <div class="waste-details">
                        <p><strong>Category:</strong> <span class="category-tag ${foundItem.category}">${foundItem.category.toUpperCase()} WASTE</span></p>
                        <p><strong>Disposal Guide:</strong> ${foundItem.tip}</p>
                        ${foundItem.warning ? `<div class="alert warning"><i class="fas fa-exclamation-triangle"></i> ${foundItem.warning}</div>` : ''}
                        <div class="points-earned">
                            <i class="fas fa-star"></i> You earned ${foundItem.points} Green Points for learning!
                        </div>
                    </div>
                    <div class="waste-actions">
                        <button class="btn btn-outline" onclick="app.shareWasteInfo('${foundItem.name}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                        <button class="btn btn-accent" onclick="app.saveWasteItem('${foundItem.name}')">
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                    </div>
                `;
                this.addPoints(foundItem.points);
            } else {
                wasteResult.className = 'waste-result show';
                wasteResult.innerHTML = `
                    <h3>Item Not Found</h3>
                    <p>We couldn't identify "${query}" in our database.</p>
                    <div class="alert info">
                        <i class="fas fa-lightbulb"></i> 
                        <strong>Suggestions:</strong>
                        <ul>
                            <li>Try different keywords (e.g., "plastic bottle" instead of "PET bottle")</li>
                            <li>Check the spelling</li>
                            <li>Use our image recognition feature</li>
                            <li>Contact support to add this item to our database</li>
                        </ul>
                    </div>
                    <button class="btn btn-accent" onclick="app.requestWasteItem('${query}')">
                        <i class="fas fa-plus"></i> Request to Add This Item
                    </button>
                `;
            }
        }, 1500);
    }

    handleImageUpload(e) {
        const file = e.target.files[0] || (e.dataTransfer && e.dataTransfer.files[0]);
        const uploadPreview = document.getElementById('uploadPreview');
        
        if (!file) return;

        if (file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                uploadPreview.innerHTML = `<img src="${e.target.result}" alt="Upload preview">`;
                
                // Simulate AI analysis
                this.showLoading('Analyzing image with AI...');
                
                setTimeout(() => {
                    this.hideLoading();
                    const wasteResult = document.getElementById('wasteResult');
                    wasteResult.className = 'waste-result show recyclable';
                    wasteResult.innerHTML = `
                        <h3>Image Analysis Result</h3>
                        <div class="analysis-result">
                            <div class="uploaded-image">
                                <img src="${e.target.result}" alt="Analyzed waste" style="max-width: 200px; border-radius: 10px;">
                            </div>
                            <div class="analysis-details">
                                <p><strong>Identified as:</strong> Plastic Water Bottle</p>
                                <p><strong>Category:</strong> <span class="category-tag dry">DRY WASTE</span></p>
                                <p><strong>Disposal:</strong> Rinse and place in recycling bin. Remove cap and label.</p>
                                <div class="confidence">
                                    <strong>Confidence:</strong> 92%
                                    <div class="confidence-bar">
                                        <div class="confidence-fill" style="width: 92%"></div>
                                    </div>
                                </div>
                                <div class="points-earned">
                                    <i class="fas fa-star"></i> You earned 15 Green Points for using image recognition!
                                </div>
                            </div>
                        </div>
                    `;
                    this.addPoints(15);
                }, 2000);
            };
            
            reader.readAsDataURL(file);
        } else {
            this.showToast('Please upload an image file (JPG, PNG, GIF)', 'error');
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('dragover');
    }

    unhighlight(element) {
        element.classList.remove('dragover');
    }

    // Waste Sorting Game
    initializeGame() {
        const startGameBtn = document.getElementById('startGameBtn');
        const wasteItemsContainer = document.getElementById('wasteItems');
        const wasteBins = document.querySelectorAll('.waste-bin');

        startGameBtn.addEventListener('click', () => {
            this.startGame();
        });

        // Initialize drag and drop for bins
        wasteBins.forEach(bin => {
            bin.addEventListener('dragover', this.dragOver);
            bin.addEventListener('dragenter', this.dragEnter);
            bin.addEventListener('dragleave', this.dragLeave);
            bin.addEventListener('drop', (e) => this.drop(e));
        });
    }

    startGame() {
        if (this.gameActive) return;

        this.gameActive = true;
        this.gameScore = 0;
        this.gameStreak = 0;
        this.gameTimeLeft = 60;

        document.getElementById('startGameBtn').disabled = true;
        document.getElementById('startGameBtn').innerHTML = '<i class="fas fa-play"></i> Game in Progress...';

        this.updateGameUI();
        this.generateGameItems();
        this.startGameTimer();
    }

    generateGameItems() {
        const wasteItemsContainer = document.getElementById('wasteItems');
        wasteItemsContainer.innerHTML = '';

        const gameItems = [
            { name: 'Banana Peel', category: 'wet', icon: 'fa-apple-alt' },
            { name: 'Plastic Bottle', category: 'dry', icon: 'fa-bottle-water' },
            { name: 'Battery', category: 'hazardous', icon: 'fa-battery-full' },
            { name: 'Mobile Phone', category: 'e-waste', icon: 'fa-mobile-screen' },
            { name: 'Newspaper', category: 'dry', icon: 'fa-newspaper' },
            { name: 'Egg Shells', category: 'wet', icon: 'fa-egg' },
            { name: 'Medicine', category: 'hazardous', icon: 'fa-pills' },
            { name: 'Cardboard', category: 'dry', icon: 'fa-box' }
        ];

        // Shuffle and take 6 items
        const shuffled = gameItems.sort(() => 0.5 - Math.random()).slice(0, 6);

        shuffled.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'waste-item';
            itemEl.draggable = true;
            itemEl.dataset.category = item.category;
            itemEl.dataset.name = item.name;
            itemEl.innerHTML = `<i class="fas ${item.icon}"></i> ${item.name}`;
            
            itemEl.addEventListener('dragstart', (e) => this.dragStart(e));
            wasteItemsContainer.appendChild(itemEl);
        });
    }

    dragStart(e) {
        if (!this.gameActive) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', e.target.dataset.name);
        e.target.classList.add('dragging');
        setTimeout(() => e.target.style.display = 'none', 0);
    }

    dragOver(e) {
        e.preventDefault();
    }

    dragEnter(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    dragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    drop(e) {
        if (!this.gameActive) return;

        e.preventDefault();
        e.target.classList.remove('drag-over');

        const itemName = e.dataTransfer.getData('text/plain');
        const draggedItem = document.querySelector(`.waste-item[data-name="${itemName}"]`);
        const correctCategory = draggedItem.dataset.category;
        const targetCategory = e.target.dataset.category;

        if (!draggedItem || !targetCategory) return;

        if (correctCategory === targetCategory) {
            // Correct bin
            this.gameScore += 10;
            this.gameStreak += 1;
            
            // Add streak bonus
            if (this.gameStreak >= 3) {
                this.gameScore += 5; // Bonus points for streak
            }

            e.target.classList.add('correct');
            setTimeout(() => e.target.classList.remove('correct'), 1000);

            this.showToast(`Correct! +10 points (Streak: ${this.gameStreak})`, 'success');
            
            // Remove item from available items
            draggedItem.remove();

            // Check if game should continue
            const remainingItems = document.querySelectorAll('.waste-item').length;
            if (remainingItems === 0) {
                this.generateGameItems();
            }
        } else {
            // Wrong bin
            this.gameStreak = 0;
            e.target.classList.add('incorrect');
            setTimeout(() => e.target.classList.remove('incorrect'), 1000);
            
            this.showToast('Oops! Wrong bin. Try again!', 'error');
            
            // Return item to original position
            draggedItem.style.display = '';
            draggedItem.classList.remove('dragging');
        }

        this.updateGameUI();
    }

    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.gameTimeLeft--;
            this.updateGameUI();

            if (this.gameTimeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateGameUI() {
        document.getElementById('gameScore').textContent = this.gameScore;
        document.getElementById('gameStreak').textContent = this.gameStreak;
        document.getElementById('gameTime').textContent = this.gameTimeLeft;

        // Update time color when running low
        const timeElement = document.getElementById('gameTime');
        if (this.gameTimeLeft <= 10) {
            timeElement.style.color = '#FF0000';
            timeElement.style.animation = 'pulse 1s infinite';
        } else {
            timeElement.style.color = '';
            timeElement.style.animation = '';
        }
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);

        document.getElementById('startGameBtn').disabled = false;
        document.getElementById('startGameBtn').innerHTML = '<i class="fas fa-play"></i> Play Again';

        // Calculate final score with time bonus
        const timeBonus = Math.floor(this.gameTimeLeft / 5);
        const finalScore = this.gameScore + timeBonus;

        // Add points to user
        this.addPoints(finalScore);

        // Show game over modal
        const wasteResult = document.getElementById('wasteResult');
        wasteResult.className = 'waste-result show';
        wasteResult.innerHTML = `
            <h3>Game Over! 🎮</h3>
            <div class="game-results">
                <div class="result-item">
                    <span class="result-label">Final Score:</span>
                    <span class="result-value">${this.gameScore}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Time Bonus:</span>
                    <span class="result-value">+${timeBonus}</span>
                </div>
                <div class="result-item total">
                    <span class="result-label">Total Points Earned:</span>
                    <span class="result-value">${finalScore}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Max Streak:</span>
                    <span class="result-value">${this.gameStreak}</span>
                </div>
            </div>
            <div class="game-actions">
                <button class="btn btn-accent" onclick="app.startGame()">
                    <i class="fas fa-redo"></i> Play Again
                </button>
                <button class="btn btn-outline" onclick="app.navigateToPage('challenges')">
                    <i class="fas fa-trophy"></i> More Challenges
                </button>
            </div>
        `;

        this.showToast(`Game completed! You earned ${finalScore} Green Points`, 'success');
    }

    // Challenges System
    loadChallenges() {
        const challenges = {
            daily: [
                { id: 1, name: "Plastic-Free Day", description: "Avoid using any single-use plastic items for the entire day", points: 50, completed: false, icon: "fa-ban-plastic" },
                { id: 2, name: "Kitchen Waste Segregation", description: "Properly separate all kitchen waste into wet and dry categories", points: 30, completed: true, icon: "fa-trash-alt" },
                { id: 3, name: "E-Waste Identification", description: "Identify 3 e-waste items in your home and learn proper disposal", points: 40, completed: false, icon: "fa-laptop" }
            ],
            weekly: [
                { id: 4, name: "Clean Your Galli", description: "Organize or participate in cleaning your street/neighborhood", points: 100, completed: false, icon: "fa-broom" },
                { id: 5, name: "Composting Starter", description: "Begin home composting or maintain existing compost for the week", points: 80, completed: false, icon: "fa-leaf" },
                { id: 6, name: "Recycling Advocate", description: "Educate 3 people about proper recycling practices", points: 70, completed: false, icon: "fa-chalkboard-teacher" }
            ],
            monthly: [
                { id: 7, name: "Waste Audit", description: "Conduct a full waste audit of your household for one month", points: 200, completed: false, icon: "fa-chart-bar" },
                { id: 8, name: "Zero Waste Week", description: "Generate minimal to no waste for an entire week", points: 150, completed: false, icon: "fa-recycle" },
                { id: 9, name: "Community Leader", description: "Organize or lead a community cleanliness drive", points: 180, completed: false, icon: "fa-users" }
            ]
        };

        this.renderChallenges(challenges.daily, 'dailyChallenges');
        this.renderChallenges(challenges.weekly, 'weeklyChallenges');
        this.renderChallenges(challenges.monthly, 'monthlyChallenges');

        // Filter functionality
        document.querySelectorAll('.challenge-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const frequency = this.dataset.frequency;
                
                document.querySelectorAll('.challenge-filters .filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                document.querySelectorAll('.challenge-category').forEach(category => {
                    if (frequency === 'all') {
                        category.style.display = 'block';
                    } else {
                        category.style.display = category.querySelector('h3').textContent.toLowerCase().includes(frequency) ? 'block' : 'none';
                    }
                });
            });
        });
    }

    renderChallenges(challenges, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = challenges.map(challenge => `
            <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-header">
                    <div class="challenge-info">
                        <h4>${challenge.name}</h4>
                        <p>${challenge.description}</p>
                    </div>
                    <div class="challenge-points">+${challenge.points}</div>
                </div>
                <div class="challenge-meta">
                    <span class="challenge-tag ${challenge.completed ? 'completed' : ''}">
                        ${challenge.completed ? 'Completed' : 'Available'}
                    </span>
                    ${!challenge.completed ? `
                        <button class="complete-btn" onclick="app.completeChallenge(${challenge.id}, ${challenge.points})">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    completeChallenge(challengeId, points) {
        // Simulate API call
        this.showLoading('Completing challenge...');
        
        setTimeout(() => {
            this.hideLoading();
            this.addPoints(points);
            this.showToast(`Challenge completed! ${points} Green Points earned`, 'success');
            
            // Update UI
            const completeBtn = event.target;
            completeBtn.disabled = true;
            completeBtn.innerHTML = '<i class="fas fa-check"></i> Completed';
            completeBtn.closest('.challenge-item').classList.add('completed');
            
            // Update progress
            this.updateProgress();
        }, 1000);
    }

    updateProgress() {
        // Update monthly progress (simulated)
        const progressFill = document.getElementById('monthlyProgress');
        const newProgress = Math.min(100, parseInt(progressFill.style.width) + 10);
        progressFill.style.width = newProgress + '%';
        
        // Update progress stats
        const progressStats = document.querySelector('.progress-stats');
        if (progressStats) {
            progressStats.innerHTML = `
                <span>${newProgress}% Complete</span>
                <span>${this.userPoints}/1000 Points</span>
            `;
        }
    }

    loadBadges() {
        const badges = [
            { id: 1, name: "Green Beginner", description: "Completed your first challenge", icon: "fa-seedling", earned: true },
            { id: 2, name: "Waste Warrior", description: "Properly sorted 50 items", icon: "fa-shield-alt", earned: true },
            { id: 3, name: "Eco Educator", description: "Shared 5 tips with friends", icon: "fa-chalkboard-teacher", earned: false },
            { id: 4, name: "Plastic Free", description: "Avoided plastic for 7 days", icon: "fa-times-circle", earned: false },
            { id: 5, name: "Compost Master", description: "Started home composting", icon: "fa-recycle", earned: false },
            { id: 6, name: "Neighborhood Hero", description: "Organized a cleanup", icon: "fa-user-astronaut", earned: false },
            { id: 7, name: "Recycling Expert", description: "Recycled 100 items correctly", icon: "fa-recycle", earned: true },
            { id: 8, name: "Clean Streak", description: "7-day activity streak", icon: "fa-fire", earned: true }
        ];

        const container = document.getElementById('badgesContainer');
        if (!container) return;

        container.innerHTML = badges.map(badge => `
            <div class="badge ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge-icon">
                    <i class="fas ${badge.icon}"></i>
                </div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
                ${badge.earned ? 
                    '<div class="badge-earned"><i class="fas fa-check"></i> Earned</div>' : 
                    '<div class="badge-progress"><div class="progress-text">Locked</div><div class="progress-bar-small"><div class="progress-fill-small" style="width: 0%"></div></div></div>'
                }
            </div>
        `).join('');
    }

    loadRewards() {
        const rewards = [
            { id: 1, name: "Eco-friendly Water Bottle", description: "Stainless steel insulated water bottle", points: 500, available: true },
            { id: 2, name: "Cloth Shopping Bag Set", description: "Set of 3 reusable cloth bags", points: 300, available: true },
            { id: 3, name: "Compost Bin", description: "Home composting unit", points: 800, available: false },
            { id: 4, name: "Plant a Tree", description: "We'll plant a tree in your name", points: 1000, available: true },
            { id: 5, name: "Eco Workshop Pass", description: "Free pass to sustainability workshop", points: 400, available: true },
            { id: 6, name: "Solar Charger", description: "Portable solar phone charger", points: 1200, available: false }
        ];

        const container = document.getElementById('rewardsContainer');
        if (!container) return;

        container.innerHTML = rewards.map(reward => `
            <div class="reward-card ${reward.available ? 'available' : 'redeemed'}">
                <div class="reward-header">
                    <div class="reward-name">${reward.name}</div>
                    <div class="reward-points">${reward.points} pts</div>
                </div>
                <div class="reward-description">${reward.description}</div>
                <div class="reward-footer">
                    <span class="reward-status ${reward.available ? 'status-available' : 'status-redeemed'}">
                        ${reward.available ? 'Available' : 'Coming Soon'}
                    </span>
                    <button class="redeem-btn" ${!reward.available || this.userPoints < reward.points ? 'disabled' : ''} 
                            onclick="app.redeemReward(${reward.id}, ${reward.points})">
                        ${this.userPoints >= reward.points ? 'Redeem' : 'Need More Points'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    redeemReward(rewardId, points) {
        if (this.userPoints < points) {
            this.showToast('Not enough Green Points to redeem this reward', 'error');
            return;
        }

        this.showLoading('Processing redemption...');
        
        setTimeout(() => {
            this.hideLoading();
            this.userPoints -= points;
            this.updateUserPoints();
            this.showToast(`Reward redeemed successfully! ${points} points deducted`, 'success');
            this.loadRewards(); // Refresh rewards display
        }, 1500);
    }

    // Leaderboard System
    loadLeaderboard() {
        const cities = [
            { name: "Pune", users: 9800, score: 125400, improvement: 12, avatar: "P" },
            { name: "Mumbai", users: 12500, score: 118200, improvement: 8, avatar: "M" },
            { name: "Kolhapur", users: 3500, score: 107500, improvement: 15, avatar: "K" },
            { name: "Nagpur", users: 5200, score: 98200, improvement: 5, avatar: "N" },
            { name: "Nashik", users: 4100, score: 95400, improvement: 3, avatar: "N" },
            { name: "Solapur", users: 2800, score: 87600, improvement: -2, avatar: "S" },
            { name: "Aurangabad", users: 3200, score: 82300, improvement: 7, avatar: "A" },
            { name: "Amravati", users: 2100, score: 78900, improvement: 10, avatar: "A" }
        ];

        const container = document.getElementById('cityLeaderboard');
        if (!container) return;

        container.innerHTML = cities.map((city, index) => `
            <div class="leaderboard-entry ${index < 3 ? 'top-3' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="name">
                    <div class="user-avatar">${city.avatar}</div>
                    ${city.name}
                </div>
                <div class="points">${city.score.toLocaleString()}</div>
                <div class="progress">
                    <span class="${city.improvement >= 0 ? 'positive' : 'negative'}">
                        ${city.improvement >= 0 ? '+' : ''}${city.improvement}%
                    </span>
                </div>
                <div class="users">${city.users.toLocaleString()}</div>
            </div>
        `).join('');

        // Add CSS for positive/negative indicators
        const style = document.createElement('style');
        style.textContent = `
            .positive { color: #4CAF50; }
            .negative { color: #F44336; }
        `;
        document.head.appendChild(style);

        // Filter functionality
        document.querySelectorAll('.leaderboard-controls .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.leaderboard-controls .filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                // In a real app, this would filter the leaderboard data
                app.showToast(`Showing ${this.textContent} ranking`, 'info');
            });
        });
    }

    loadUserStats() {
        // Update user stats on leaderboard page
        document.getElementById('userRank').textContent = `#${this.userRank}`;
        document.getElementById('userPoints').textContent = this.userPoints.toLocaleString();
        document.getElementById('userChallenges').textContent = '42'; // Simulated
        document.getElementById('userBadges').textContent = '8'; // Simulated
    }

    // Awareness and Education Content
    loadAwarenessContent() {
        this.loadTips();
        this.loadSchemes();
        this.loadPhotos();
    }

    loadTips() {
        const tips = [
            { id: 1, content: "Use cloth bags instead of plastic when shopping. Carry a reusable bag with you always.", category: "plastic reduction" },
            { id: 2, content: "Layer your compost with dry leaves for better decomposition. Turn it weekly for faster results.", category: "composting" },
            { id: 3, content: "Always dispose sanitary waste separately wrapped in newspaper. Never mix with regular waste.", category: "biomedical" },
            { id: 4, content: "Fix leaky taps immediately. A dripping tap can waste 20,000 liters of water annually.", category: "water conservation" },
            { id: 5, content: "Start a kitchen garden with your compost. Grow herbs and vegetables at home.", category: "sustainable living" }
        ];

        const container = document.getElementById('tipCarousel');
        if (!container) return;

        container.innerHTML = tips.map(tip => `
            <div class="tip-card">
                <h3>${tip.category.charAt(0).toUpperCase() + tip.category.slice(1)} Tip</h3>
                <p>${tip.content}</p>
                <div class="tip-actions">
                    <button class="btn btn-accent" onclick="app.readTip(${tip.id})">
                        <i class="fas fa-check"></i> Mark as Read
                    </button>
                    <button class="btn btn-outline" onclick="app.shareTip(${tip.id})">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `).join('');
    }

    readTip(tipId) {
        this.addPoints(5);
        this.showToast('Tip marked as read! +5 Green Points', 'success');
        
        // Mark button as completed
        const button = event.target;
        button.innerHTML = '<i class="fas fa-check-circle"></i> Read';
        button.disabled = true;
    }

    shareTip(tipId) {
        this.showToast('Tip sharing feature would open here', 'info');
    }

    loadSchemes() {
        const schemes = [
            { name: "Swachh Bharat Mission - Urban", description: "A nationwide campaign to clean streets, roads, and infrastructure of India's cities. Focuses on solid waste management, toilet construction, and behavioral change.", link: "#" },
            { name: "Plastic Waste Management Rules 2016", description: "Guidelines for plastic waste collection, segregation, treatment and disposal. Promotes producer responsibility and recycling.", link: "#" },
            { name: "Municipal Composting Initiative", description: "Subsidies for home composting units and community composting facilities. Training programs available.", link: "#" },
            { name: "E-Waste Management Rules 2022", description: "Updated guidelines for environmentally sound management of e-waste. Includes extended producer responsibility.", link: "#" }
        ];

        const container = document.getElementById('schemesContainer');
        if (!container) return;

        container.innerHTML = schemes.map(scheme => `
            <div class="scheme-card">
                <h3>${scheme.name}</h3>
                <p>${scheme.description}</p>
                <div class="scheme-actions">
                    <a href="${scheme.link}" class="btn btn-accent">Learn More</a>
                    <button class="btn btn-outline" onclick="app.saveScheme('${scheme.name}')">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadPhotos() {
        const photos = [
            { title: "Clean Park Initiative", location: "Pune", before: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Clean+Park", after: "https://via.placeholder.com/300x200/2E7D32/FFFFFF?text=Beautiful+Park", votes: 42, participants: 25 },
            { title: "Beach Cleanup Drive", location: "Mumbai", before: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Dirty+Beach", after: "https://via.placeholder.com/300x200/2E7D32/FFFFFF?text=Clean+Beach", votes: 35, participants: 18 },
            { title: "Community Composting", location: "Nagpur", before: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Waste+Pile", after: "https://via.placeholder.com/300x200/2E7D32/FFFFFF?text=Rich+Compost", votes: 28, participants: 12 },
            { title: "School Awareness Program", location: "Nashik", before: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Unaware+Students", after: "https://via.placeholder.com/300x200/2E7D32/FFFFFF?text=Eco+Champions", votes: 31, participants: 45 }
        ];

        const container = document.getElementById('photoWall');
        if (!container) return;

        container.innerHTML = photos.map(photo => `
            <div class="photo-card">
                <div class="photo-slider">
                    <img src="${photo.before}" alt="Before: ${photo.title}">
                    <img src="${photo.after}" alt="After: ${photo.title}">
                </div>
                <div class="photo-info">
                    <div class="photo-title">${photo.title}</div>
                    <div class="photo-location"><i class="fas fa-map-marker-alt"></i> ${photo.location}</div>
                    <div class="photo-stats">
                        <span><i class="fas fa-heart"></i> ${photo.votes} votes</span>
                        <span><i class="fas fa-users"></i> ${photo.participants} participants</span>
                    </div>
                    <div class="photo-votes">
                        <button class="vote-btn" onclick="app.votePhoto('${photo.title}')">
                            <i class="fas fa-heart"></i> Vote
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="app.sharePhoto('${photo.title}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    votePhoto(photoTitle) {
        this.addPoints(2);
        this.showToast(`Voted for ${photoTitle}! +2 Green Points`, 'success');
        
        const button = event.target;
        button.innerHTML = '<i class="fas fa-heart"></i> Voted';
        button.disabled = true;
    }

    // Profile Management
    loadProfileData() {
        // Update profile information
        document.getElementById('userName').textContent = 'Swachhta User';
        document.getElementById('userLocation').textContent = 'Mumbai, Maharashtra';
        document.getElementById('profilePoints').textContent = this.userPoints.toLocaleString();
        document.getElementById('profileStreak').textContent = this.userStreak;
        document.getElementById('profileRank').textContent = `#${this.userRank}`;
    }

    initializeCharts() {
        // Points chart
        const pointsCtx = document.getElementById('pointsChart');
        if (pointsCtx) {
            new Chart(pointsCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Monthly Green Points',
                        data: [450, 620, 580, 890, 1100, 1250],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Challenges chart
        const challengesCtx = document.getElementById('challengesChart');
        if (challengesCtx) {
            new Chart(challengesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress', 'Available'],
                    datasets: [{
                        data: [42, 8, 15],
                        backgroundColor: [
                            '#4CAF50',
                            '#FFC107',
                            '#E0E0E0'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // Certificate System
    checkCertificateEligibility() {
        if (this.userPoints >= 1000) {
            document.getElementById('certificate-section').style.display = 'block';
        }
    }

    initializeModals() {
        // Certificate modal
        document.getElementById('view-certificate-btn').addEventListener('click', () => {
            this.openCertificateModal();
        });

        document.getElementById('closeCertificate').addEventListener('click', () => {
            this.closeCertificateModal();
        });

        document.getElementById('download-certificate').addEventListener('click', () => {
            this.downloadCertificate();
        });

        document.getElementById('share-certificate').addEventListener('click', () => {
            this.shareCertificate();
        });

        // Report modal
        document.getElementById('closeReport').addEventListener('click', () => {
            this.closeReportModal();
        });

        document.getElementById('cancelReport').addEventListener('click', () => {
            this.closeReportModal();
        });

        document.getElementById('useCurrentLocation').addEventListener('click', () => {
            this.useCurrentLocation();
        });

        document.getElementById('reportForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReport();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.id === 'certificateModal') {
                this.closeCertificateModal();
            }
            if (e.target.id === 'reportModal') {
                this.closeReportModal();
            }
        });
    }

    openCertificateModal() {
        document.getElementById('certificateModal').style.display = 'flex';
        document.getElementById('certificate-user').textContent = 'Swachhta User';
        document.getElementById('certificate-points').textContent = this.userPoints + '+ Green Points';
        document.getElementById('certificate-date').textContent = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    closeCertificateModal() {
        document.getElementById('certificateModal').style.display = 'none';
    }

    downloadCertificate() {
        this.showToast('Certificate download would start here', 'info');
        // In a real app, this would generate and download a PDF
    }

    shareCertificate() {
        this.showToast('Certificate sharing feature would open here', 'info');
        // In a real app, this would share on social media
    }

    openReportModal() {
        document.getElementById('reportModal').style.display = 'flex';
    }

    closeReportModal() {
        document.getElementById('reportModal').style.display = 'none';
        document.getElementById('reportForm').reset();
    }

    useCurrentLocation() {
        this.showLoading('Getting your location...');
        
        // Simulate location detection
        setTimeout(() => {
            this.hideLoading();
            document.getElementById('issueLocation').value = 'Current Location: Mumbai, Maharashtra';
            this.showToast('Location detected successfully', 'success');
        }, 1500);
    }

    submitReport() {
        const issueType = document.getElementById('issueType').value;
        const location = document.getElementById('issueLocation').value;
        const description = document.getElementById('issueDescription').value;

        if (!issueType || !location) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        this.showLoading('Submitting report...');

        setTimeout(() => {
            this.hideLoading();
            this.closeReportModal();
            this.addPoints(15);
            this.showToast('Report submitted successfully! +15 Green Points', 'success');
            
            // Add to activity feed
            this.addActivity('You reported a cleanliness issue', 15);
        }, 2000);
    }

    // Chatbot System
    initializeChatbot() {
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotContainer = document.getElementById('chatbotContainer');
        const closeChatbot = document.getElementById('closeChatbot');
        const minimizeChatbot = document.getElementById('minimizeChatbot');
        const sendMessage = document.getElementById('sendMessage');
        const chatbotInput = document.getElementById('chatbotInput');

        chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });

        closeChatbot.addEventListener('click', () => {
            this.closeChatbot();
        });

        minimizeChatbot.addEventListener('click', () => {
            this.minimizeChatbot();
        });

        sendMessage.addEventListener('click', () => {
            this.sendChatbotMessage();
        });

        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatbotMessage();
            }
        });

        // Quick actions
        document.querySelectorAll('.chatbot-quick-actions .quick-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                app.handleQuickAction(action);
            });
        });
    }

    toggleChatbot() {
        const chatbotContainer = document.getElementById('chatbotContainer');
        this.chatbotOpen = !this.chatbotOpen;
        
        if (this.chatbotOpen) {
            chatbotContainer.style.display = 'flex';
            document.getElementById('chatbotNotification').style.display = 'none';
        } else {
            chatbotContainer.style.display = 'none';
        }
    }

    closeChatbot() {
        document.getElementById('chatbotContainer').style.display = 'none';
        this.chatbotOpen = false;
    }

    minimizeChatbot() {
        // In a real app, this would minimize the chatbot to a small bar
        this.showToast('Chatbot minimize feature would activate here', 'info');
    }

    sendChatbotMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (!message) return;

        this.addChatbotMessage(message, 'user');
        input.value = '';

        // Simulate bot response
        setTimeout(() => {
            this.generateBotResponse(message);
        }, 1000);
    }

    addChatbotMessage(message, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        messageEl.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    generateBotResponse(userMessage) {
        const responses = {
            'greeting': "Namaste! I'm your Swachhta Assistant. How can I help you with waste management today?",
            'segregation': "Waste segregation means separating waste into different categories:\n• Wet Waste: Food scraps, vegetable peels\n• Dry Waste: Paper, plastic, metal\n• Hazardous: Batteries, medicines\n• E-Waste: Electronics, gadgets",
            'recycling': "Here are recycling centers near you:\n• Mumbai: Andheri Recycling Center\n• Pune: Hadapsar Facility\n• Nagpur: Hingna Center\nYou can also check our app for the nearest locations!",
            'challenges': "Current active challenges:\n• Plastic-Free Day (50 points)\n• Kitchen Segregation (30 points)\n• E-Waste Identification (40 points)\nComplete them to earn Green Points!",
            'points': "Green Points are rewards for eco-friendly actions:\n• Waste identification: 5-20 points\n• Challenges: 30-200 points\n• Reports: 15 points\n• Learning: 5 points\nRedeem points for exciting rewards!",
            'default': "I can help you with:\n• Waste segregation guidance\n• Recycling center locations\n• Challenge information\n• Green Points explanation\nWhat would you like to know?"
        };

        let responseKey = 'default';
        userMessage = userMessage.toLowerCase();

        if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('namaste')) {
            responseKey = 'greeting';
        } else if (userMessage.includes('segregat') || userMessage.includes('separate') || userMessage.includes('category')) {
            responseKey = 'segregation';
        } else if (userMessage.includes('recycl') || userMessage.includes('center') || userMessage.includes('facility')) {
            responseKey = 'recycling';
        } else if (userMessage.includes('challenge') || userMessage.includes('task') || userMessage.includes('mission')) {
            responseKey = 'challenges';
        } else if (userMessage.includes('point') || userMessage.includes('reward') || userMessage.includes('earn')) {
            responseKey = 'points';
        }

        this.addChatbotMessage(responses[responseKey], 'bot');
    }

    handleQuickAction(action) {
        const actions = {
            'segregation': "Can you explain waste segregation?",
            'recycling': "Where are the recycling centers?",
            'challenges': "What challenges are available?"
        };

        document.getElementById('chatbotInput').value = actions[action];
        this.sendChatbotMessage();
    }

    // Activity Feed
    loadActivityFeed() {
        const activities = [
            { user: "You", action: "completed Plastic-Free Day challenge", points: 50, time: "2 hours ago" },
            { user: "Priya S.", action: "reported a garbage spot in Pune", points: 15, time: "3 hours ago" },
            { user: "Green Warriors", action: "organized beach cleanup in Mumbai", points: 200, time: "5 hours ago" },
            { user: "You", action: "learned about e-waste disposal", points: 10, time: "1 day ago" },
            { user: "Eco Club Nashik", action: "planted 50 trees in community park", points: 150, time: "1 day ago" }
        ];

        const container = document.getElementById('activityFeed');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar">
                    ${activity.user === 'You' ? 'Y' : activity.user.charAt(0)}
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        <span class="activity-user">${activity.user}</span> ${activity.action}
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                ${activity.points ? `<div class="activity-points">+${activity.points}</div>` : ''}
            </div>
        `).join('');
    }

    addActivity(action, points) {
        const container = document.getElementById('activityFeed');
        const activity = {
            user: "You",
            action: action,
            points: points,
            time: "Just now"
        };

        const activityEl = document.createElement('div');
        activityEl.className = 'activity-item';
        activityEl.innerHTML = `
            <div class="activity-avatar">Y</div>
            <div class="activity-content">
                <div class="activity-text">
                    <span class="activity-user">You</span> ${action}
                </div>
                <div class="activity-time">Just now</div>
            </div>
            <div class="activity-points">+${points}</div>
        `;

        container.insertBefore(activityEl, container.firstChild);
        
        // Limit to 10 activities
        if (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    }

    // Utility Functions
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showLoading(message = 'Loading...') {
        const spinner = document.getElementById('loadingSpinner');
        spinner.querySelector('p').textContent = message;
        spinner.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    addPoints(points) {
        this.userPoints += points;
        this.updateUserPoints();
        this.checkCertificateEligibility();
        
        // Animate points addition
        this.animatePoints(points);
    }

    updateUserPoints() {
        // Update points display everywhere
        const pointsElements = document.querySelectorAll('#userPoints, #profilePoints');
        pointsElements.forEach(el => {
            el.textContent = this.userPoints.toLocaleString();
        });
    }

    animatePoints(points) {
        const pointsEl = document.createElement('div');
        pointsEl.className = 'points-animation';
        pointsEl.textContent = `+${points}`;
        pointsEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: #4CAF50;
            z-index: 10000;
            animation: floatUp 1s ease-out forwards;
        `;

        document.body.appendChild(pointsEl);

        // Add animation CSS
        if (!document.querySelector('#pointsAnimation')) {
            const style = document.createElement('style');
            style.id = 'pointsAnimation';
            style.textContent = `
                @keyframes floatUp {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -100px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            pointsEl.remove();
        }, 1000);
    }

    loadUserData() {
        // Simulate loading user data
        setTimeout(() => {
            this.updateUserPoints();
            this.loadUserStats();
            this.loadProfileData();
        }, 500);
    }

    // Additional utility methods
    shareWasteInfo(itemName) {
        this.showToast(`Sharing information about ${itemName}`, 'info');
    }

    saveWasteItem(itemName) {
        this.showToast(`${itemName} saved to your collection`, 'success');
    }

    requestWasteItem(itemName) {
        this.showToast(`Request submitted to add ${itemName} to our database`, 'info');
    }

    saveScheme(schemeName) {
        this.showToast(`${schemeName} saved to your bookmarks`, 'success');
    }

    sharePhoto(photoTitle) {
        this.showToast(`Sharing ${photoTitle}`, 'info');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new SwachhtaApp();
});

// Service Worker Registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
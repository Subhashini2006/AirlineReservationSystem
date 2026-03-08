// ========================================
// Global State
// ========================================
let currentUser = null;
let currentFlights = [];
let selectedFlight = null;
let selectedSeats = [];
let passengerCount = 1;
let travelClass = 'economy';

// Airlines data
const airlines = [
    { name: 'SkyWay Airlines', code: 'SW' },
    { name: 'Global Airways', code: 'GA' },
    { name: 'Pacific Wings', code: 'PW' },
    { name: 'Atlantic Air', code: 'AA' },
    { name: 'Express Jet', code: 'EJ' },
    { name: 'United Skies', code: 'US' },
    { name: 'Delta Wings', code: 'DW' },
    { name: 'Air Connect', code: 'AC' }
];

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set minimum date for departure
    const today = new Date().toISOString().split('T')[0];
    const departureDateInput = document.getElementById('departureDate');
    if (departureDateInput) {
        departureDateInput.setAttribute('min', today);
        departureDateInput.value = today;
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Check for logged in user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }

    // Show home section
    showSection('home');
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ========================================
// Navigation
// ========================================
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Load bookings if showing bookings section
    if (sectionId === 'bookings') {
        loadBookings();
    }
}

function scrollToSearch() {
    showSection('home');
    setTimeout(() => {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            searchContainer.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                searchContainer.style.animation = '';
            }, 500);
        }
    }, 100);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// ========================================
// Modal Functions
// ========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// ========================================
// Alert System
// ========================================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    alertContainer.appendChild(alert);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 4000);
}

// ========================================
// Authentication
// ========================================
function signup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        showAlert('Email already registered', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateAuthUI();

    closeModal('signupModal');
    showAlert('Account created successfully! Welcome aboard!', 'success');

    // Reset form
    event.target.reset();
}

function login(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Find user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showAlert('Invalid email or password', 'error');
        return;
    }

    // Login successful
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateAuthUI();

    closeModal('loginModal');
    showAlert(`Welcome back, ${user.name}!`, 'success');

    // Reset form
    event.target.reset();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showAlert('Logged out successfully', 'info');
    showSection('home');
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const userName = document.querySelector('.user-name');

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.name;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// ========================================
// Flight Search
// ========================================
function searchFlights(event) {
    event.preventDefault();

    const fromCity = document.getElementById('fromCity').value.trim();
    const toCity = document.getElementById('toCity').value.trim();
    const departureDate = document.getElementById('departureDate').value;
    passengerCount = parseInt(document.getElementById('passengers').value);
    travelClass = document.getElementById('travelClass').value;

    // Validation
    if (!fromCity || !toCity) {
        showAlert('Please enter both departure and destination cities', 'error');
        return;
    }

    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
        showAlert('Departure and destination cities cannot be the same', 'error');
        return;
    }

    if (!departureDate) {
        showAlert('Please select a departure date', 'error');
        return;
    }

    // Show loading
    showSection('search');
    const loading = document.getElementById('loading');
    const flightResults = document.getElementById('flightResults');
    loading.classList.add('show');
    flightResults.innerHTML = '';

    // Update route display
    document.getElementById('routeFrom').textContent = fromCity;
    document.getElementById('routeTo').textContent = toCity;

    // Generate flights after delay (simulate API call)
    setTimeout(() => {
        loading.classList.remove('show');
        currentFlights = generateFlights(fromCity, toCity, departureDate, passengerCount, travelClass);
        displayFlights(currentFlights);
    }, 1500);
}

function generateFlights(from, to, date, passengers, flightClass) {
    const flights = [];
    const numFlights = Math.floor(Math.random() * 6) + 5; // 5-10 flights

    // Base price based on class
    let basePrice = 150;
    if (flightClass === 'business') basePrice = 450;
    if (flightClass === 'first') basePrice = 900;

    for (let i = 0; i < numFlights; i++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const flightNumber = `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`;
        
        // Generate random departure time
        const depHour = Math.floor(Math.random() * 18) + 5; // 5 AM to 11 PM
        const depMinute = Math.random() < 0.5 ? 0 : 30;
        
        // Generate random duration (1-12 hours)
        const durationHours = Math.floor(Math.random() * 10) + 2;
        const durationMinutes = Math.random() < 0.5 ? 0 : 30;
        
        // Calculate arrival time
        let arrHour = depHour + durationHours;
        let arrMinute = depMinute + durationMinutes;
        if (arrMinute >= 60) {
            arrMinute -= 60;
            arrHour += 1;
        }
        arrHour = arrHour % 24;
        
        // Calculate price with some randomness
        const priceMultiplier = 1 + (Math.random() * 0.8 - 0.2); // 0.8x to 1.6x
        const price = Math.round((basePrice + durationHours * 30) * priceMultiplier * passengers);

        const flight = {
            id: `FL${Date.now()}${i}`,
            airline: airline.name,
            airlineCode: airline.code,
            flightNumber: flightNumber,
            from: from,
            to: to,
            date: date,
            departureTime: `${String(depHour).padStart(2, '0')}:${String(depMinute).padStart(2, '0')}`,
            arrivalTime: `${String(arrHour).padStart(2, '0')}:${String(arrMinute).padStart(2, '0')}`,
            duration: `${durationHours}h ${durationMinutes}m`,
            durationMinutes: durationHours * 60 + durationMinutes,
            price: price,
            class: flightClass,
            passengers: passengers
        };
        
        flights.push(flight);
    }

    // Sort by price by default
    return flights.sort((a, b) => a.price - b.price);
}

function displayFlights(flights) {
    const flightResults = document.getElementById('flightResults');
    
    if (flights.length === 0) {
        flightResults.innerHTML = `
            <div class="no-flights">
                <i class="fas fa-plane-slash"></i>
                <h3>No Flights Found</h3>
                <p>Try different dates or destinations</p>
            </div>
        `;
        return;
    }

    flightResults.innerHTML = flights.map(flight => `
        <div class="flight-card">
            <div class="flight-card-header">
                <div class="airline-info">
                    <div class="airline-logo">${flight.airlineCode}</div>
                    <div>
                        <div class="airline-name">${flight.airline}</div>
                        <div class="flight-number">${flight.flightNumber}</div>
                    </div>
                </div>
                <span class="flight-class">${flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}</span>
            </div>
            <div class="flight-card-body">
                <div class="flight-time">
                    <div class="time">${flight.departureTime}</div>
                    <div class="city">${flight.from}</div>
                </div>
                <div class="flight-duration">
                    <div class="duration-text">${flight.duration}</div>
                    <div class="duration-line">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="duration-text">Direct</div>
                </div>
                <div class="flight-time">
                    <div class="time">${flight.arrivalTime}</div>
                    <div class="city">${flight.to}</div>
                </div>
                <div class="flight-price">
                    <div class="price">$${flight.price}</div>
                    <div class="price-note">for ${flight.passengers} passenger${flight.passengers > 1 ? 's' : ''}</div>
                    <button class="btn btn-secondary" onclick="selectFlight('${flight.id}')">
                        Select <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterFlights(filterType) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    let filteredFlights = [...currentFlights];

    switch (filterType) {
        case 'price-low':
            filteredFlights.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredFlights.sort((a, b) => b.price - a.price);
            break;
        case 'duration':
            filteredFlights.sort((a, b) => a.durationMinutes - b.durationMinutes);
            break;
        case 'morning':
            filteredFlights = filteredFlights.filter(f => {
                const hour = parseInt(f.departureTime.split(':')[0]);
                return hour >= 5 && hour < 12;
            });
            break;
        case 'evening':
            filteredFlights = filteredFlights.filter(f => {
                const hour = parseInt(f.departureTime.split(':')[0]);
                return hour >= 17 && hour <= 23;
            });
            break;
        default:
            // All flights - sort by price
            filteredFlights.sort((a, b) => a.price - b.price);
    }

    displayFlights(filteredFlights);
}

// ========================================
// Flight Selection & Seat Map
// ========================================
function selectFlight(flightId) {
    if (!currentUser) {
        showAlert('Please login to book a flight', 'warning');
        openModal('loginModal');
        return;
    }

    selectedFlight = currentFlights.find(f => f.id === flightId);
    if (!selectedFlight) {
        showAlert('Flight not found', 'error');
        return;
    }

    selectedSeats = [];
    showSection('seats');
    displaySelectedFlightInfo();
    generateSeatMap();
    updateSeatCounter();
}

function displaySelectedFlightInfo() {
    const info = document.getElementById('selectedFlightInfo');
    info.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <strong>${selectedFlight.airline}</strong> - ${selectedFlight.flightNumber}
            </div>
            <div>
                <strong>${selectedFlight.from}</strong> → <strong>${selectedFlight.to}</strong>
            </div>
            <div>
                ${selectedFlight.departureTime} - ${selectedFlight.arrivalTime}
            </div>
            <div>
                <strong>$${selectedFlight.price}</strong> (${selectedFlight.passengers} passenger${selectedFlight.passengers > 1 ? 's' : ''})
            </div>
        </div>
    `;
}

function generateSeatMap() {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = '';

    // Configuration based on class
    let rows, seatsPerRow, aisleAfter;
    
    if (selectedFlight.class === 'first') {
        rows = 4;
        seatsPerRow = 4;
        aisleAfter = 2;
    } else if (selectedFlight.class === 'business') {
        rows = 6;
        seatsPerRow = 4;
        aisleAfter = 2;
    } else {
        rows = 15;
        seatsPerRow = 6;
        aisleAfter = 3;
    }

    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Generate random booked seats (20-40%)
    const bookedSeats = new Set();
    const totalSeats = rows * seatsPerRow;
    const numBooked = Math.floor(totalSeats * (0.2 + Math.random() * 0.2));
    
    for (let i = 0; i < numBooked; i++) {
        const row = Math.floor(Math.random() * rows) + 1;
        const seat = seatLetters[Math.floor(Math.random() * seatsPerRow)];
        bookedSeats.add(`${row}${seat}`);
    }

    // Generate seat rows
    for (let row = 1; row <= rows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';
        
        // Row number on left
        const rowNum = document.createElement('div');
        rowNum.className = 'row-number';
        rowNum.textContent = row;
        rowDiv.appendChild(rowNum);

        for (let seat = 0; seat < seatsPerRow; seat++) {
            // Add aisle
            if (seat === aisleAfter) {
                const aisle = document.createElement('div');
                aisle.className = 'aisle';
                rowDiv.appendChild(aisle);
            }

            const seatId = `${row}${seatLetters[seat]}`;
            const seatDiv = document.createElement('div');
            seatDiv.className = 'seat';
            seatDiv.textContent = seatLetters[seat];
            seatDiv.dataset.seatId = seatId;

            if (bookedSeats.has(seatId)) {
                seatDiv.classList.add('booked');
            } else {
                seatDiv.classList.add('available');
                seatDiv.addEventListener('click', () => toggleSeat(seatId, seatDiv));
            }

            rowDiv.appendChild(seatDiv);
        }

        // Row number on right
        const rowNumRight = document.createElement('div');
        rowNumRight.className = 'row-number';
        rowNumRight.textContent = row;
        rowDiv.appendChild(rowNumRight);

        seatMap.appendChild(rowDiv);
    }

    // Update required count
    document.getElementById('requiredCount').textContent = selectedFlight.passengers;
}

function toggleSeat(seatId, seatElement) {
    const index = selectedSeats.indexOf(seatId);
    
    if (index > -1) {
        // Deselect
        selectedSeats.splice(index, 1);
        seatElement.classList.remove('selected');
        seatElement.classList.add('available');
    } else {
        // Check if can select more
        if (selectedSeats.length >= selectedFlight.passengers) {
            showAlert(`You can only select ${selectedFlight.passengers} seat(s)`, 'warning');
            return;
        }
        // Select
        selectedSeats.push(seatId);
        seatElement.classList.remove('available');
        seatElement.classList.add('selected');
    }
    
    updateSeatCounter();
}

function updateSeatCounter() {
    document.getElementById('selectedCount').textContent = selectedSeats.length;
    
    const proceedBtn = document.getElementById('proceedBtn');
    proceedBtn.disabled = selectedSeats.length !== selectedFlight.passengers;
}

// ========================================
// Passenger Details
// ========================================
function proceedToPassengerDetails() {
    if (selectedSeats.length !== selectedFlight.passengers) {
        showAlert(`Please select ${selectedFlight.passengers} seat(s)`, 'warning');
        return;
    }
    
    showSection('passenger');
    generatePassengerForms();
    displayBookingSummary();
}

function generatePassengerForms() {
    const container = document.getElementById('passengerForms');
    container.innerHTML = '';

    for (let i = 0; i < selectedFlight.passengers; i++) {
        const form = document.createElement('div');
        form.className = 'passenger-card';
        form.innerHTML = `
            <h3><i class="fas fa-user"></i> Passenger ${i + 1} - Seat ${selectedSeats[i]}</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="passengerName${i}" placeholder="Enter full name" required>
                </div>
                <div class="form-group">
                    <label>Age *</label>
                    <input type="number" name="passengerAge${i}" placeholder="Age" min="1" max="120" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Gender *</label>
                    <select name="passengerGender${i}" required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Passport/ID Number *</label>
                    <input type="text" name="passengerPassport${i}" placeholder="Passport or ID number" required>
                </div>
            </div>
        `;
        container.appendChild(form);
    }
}

function displayBookingSummary() {
    const container = document.getElementById('bookingSummarySide');
    const pricePerPassenger = Math.round(selectedFlight.price / selectedFlight.passengers);
    
    container.innerHTML = `
        <h3 style="margin-bottom: 20px; color: var(--primary);"><i class="fas fa-receipt"></i> Booking Summary</h3>
        <div class="summary-row">
            <span>Flight</span>
            <span>${selectedFlight.flightNumber}</span>
        </div>
        <div class="summary-row">
            <span>Route</span>
            <span>${selectedFlight.from} → ${selectedFlight.to}</span>
        </div>
        <div class="summary-row">
            <span>Date</span>
            <span>${formatDate(selectedFlight.date)}</span>
        </div>
        <div class="summary-row">
            <span>Time</span>
            <span>${selectedFlight.departureTime} - ${selectedFlight.arrivalTime}</span>
        </div>
        <div class="summary-row">
            <span>Class</span>
            <span>${selectedFlight.class.charAt(0).toUpperCase() + selectedFlight.class.slice(1)}</span>
        </div>
        <div class="summary-row">
            <span>Seats</span>
            <span>${selectedSeats.join(', ')}</span>
        </div>
        <div class="summary-row">
            <span>Passengers</span>
            <span>${selectedFlight.passengers}</span>
        </div>
        <div class="summary-row">
            <span>Price per person</span>
            <span>$${pricePerPassenger}</span>
        </div>
        <div class="summary-row">
            <span><strong>Total Price</strong></span>
            <span><strong>$${selectedFlight.price}</strong></span>
        </div>
    `;
}

// ========================================
// Booking Confirmation
// ========================================
function confirmBooking(event) {
    event.preventDefault();

    // Collect passenger data
    const passengers = [];
    for (let i = 0; i < selectedFlight.passengers; i++) {
        const name = document.querySelector(`[name="passengerName${i}"]`).value.trim();
        const age = document.querySelector(`[name="passengerAge${i}"]`).value;
        const gender = document.querySelector(`[name="passengerGender${i}"]`).value;
        const passport = document.querySelector(`[name="passengerPassport${i}"]`).value.trim();

        if (!name || !age || !gender || !passport) {
            showAlert(`Please fill all details for Passenger ${i + 1}`, 'error');
            return;
        }

        passengers.push({
            name,
            age,
            gender,
            passport,
            seat: selectedSeats[i]
        });
    }

    // Create booking
    const booking = {
        id: generateBookingId(),
        userId: currentUser.id,
        flight: selectedFlight,
        passengers,
        seats: selectedSeats,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
        totalPrice: selectedFlight.price
    };

    // Save booking
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // Show confirmation
    displayConfirmation(booking);
    showSection('confirmation');
    showAlert('Booking confirmed successfully!', 'success');
}

function generateBookingId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'SW';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function displayConfirmation(booking) {
    document.getElementById('bookingId').textContent = booking.id;
    
    const ticketDetails = document.getElementById('ticketDetails');
    const passenger = booking.passengers[0];
    
    ticketDetails.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-airline">
                <i class="fas fa-plane"></i> ${booking.flight.airline}
            </div>
            <div class="ticket-class">${booking.flight.class.toUpperCase()}</div>
        </div>
        <div class="ticket-route">
            <div class="ticket-city">
                <div class="code">${booking.flight.from.substring(0, 3).toUpperCase()}</div>
                <div class="name">${booking.flight.from}</div>
            </div>
            <div class="ticket-flight-icon">
                <i class="fas fa-plane"></i>
            </div>
            <div class="ticket-city">
                <div class="code">${booking.flight.to.substring(0, 3).toUpperCase()}</div>
                <div class="name">${booking.flight.to}</div>
            </div>
        </div>
        <div class="ticket-details">
            <div class="ticket-detail">
                <div class="label">Passenger</div>
                <div class="value">${passenger.name}</div>
            </div>
            <div class="ticket-detail">
                <div class="label">Flight</div>
                <div class="value">${booking.flight.flightNumber}</div>
            </div>
            <div class="ticket-detail">
                <div class="label">Date</div>
                <div class="value">${formatDate(booking.flight.date)}</div>
            </div>
            <div class="ticket-detail">
                <div class="label">Departure</div>
                <div class="value">${booking.flight.departureTime}</div>
            </div>
            <div class="ticket-detail">
                <div class="label">Seat(s)</div>
                <div class="value">${booking.seats.join(', ')}</div>
            </div>
            <div class="ticket-detail">
                <div class="label">Total Paid</div>
                <div class="value">$${booking.totalPrice}</div>
            </div>
        </div>
    `;
}

// ========================================
// My Bookings
// ========================================
function loadBookings() {
    const content = document.getElementById('bookingsContent');
    
    if (!currentUser) {
        content.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-user-lock"></i>
                <h3>Please Login</h3>
                <p>You need to login to view your bookings</p>
                <button class="btn btn-primary" onclick="openModal('loginModal')">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </div>
        `;
        return;
    }

    const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const userBookings = allBookings.filter(b => b.userId === currentUser.id);

    if (userBookings.length === 0) {
        content.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-ticket-alt"></i>
                <h3>No Bookings Yet</h3>
                <p>You haven't made any bookings yet</p>
                <button class="btn btn-primary" onclick="showSection('home')">
                    <i class="fas fa-search"></i> Search Flights
                </button>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="bookings-table-container">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Flight</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th>Passengers</th>
                        <th>Seats</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${userBookings.map(booking => `
                        <tr>
                            <td><strong>${booking.id}</strong></td>
                            <td>${booking.flight.flightNumber}</td>
                            <td>${booking.flight.from} → ${booking.flight.to}</td>
                            <td>${formatDate(booking.flight.date)}</td>
                            <td>${booking.passengers.length}</td>
                            <td>${booking.seats.join(', ')}</td>
                            <td><strong>$${booking.totalPrice}</strong></td>
                            <td>
                                <span class="status-badge status-${booking.status}">
                                    ${booking.status.toUpperCase()}
                                </span>
                            </td>
                            <td>
                                ${booking.status === 'confirmed' ? `
                                    <button class="btn btn-danger" onclick="cancelBooking('${booking.id}')" style="padding: 8px 16px; font-size: 14px;">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                ` : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const index = bookings.findIndex(b => b.id === bookingId);
    
    if (index > -1) {
        bookings[index].status = 'cancelled';
        localStorage.setItem('bookings', JSON.stringify(bookings));
        loadBookings();
        showAlert('Booking cancelled successfully', 'success');
    }
}

// ========================================
// Utility Functions
// ========================================
function swapCities() {
    const fromInput = document.getElementById('fromCity');
    const toInput = document.getElementById('toCity');
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
}

function quickSearch(from, to) {
    document.getElementById('fromCity').value = from;
    document.getElementById('toCity').value = to;
    scrollToSearch();
}

function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const weatherDisplay = document.getElementById('weather-display');
    
    // Weather elements
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const pressure = document.getElementById('pressure');
    const feelsLike = document.getElementById('feels-like');
    const visibility = document.getElementById('visibility');
    const sunrise = document.getElementById('sunrise');
    const sunset = document.getElementById('sunset');
    const forecastCards = document.getElementById('forecast-cards');
    const funFact = document.getElementById('fun-fact');
    
    // API Key - Replace with your actual OpenWeatherMap API key
    const apiKey = 'f1f313e9e6cb2c27032fd49882ad0664';
    
    // Fun facts array
    const funFacts = [
        "Did you know? The highest temperature ever recorded was 56.7°C (134°F) in Death Valley, California in 1913! 🔥",
        "Lightning can heat the air to 30,000°C (54,000°F) - hotter than the surface of the sun! ⚡",
        "Snowflakes falling at 2-4 mph can take about 1 hour to reach the ground. ❄️⏳",
        "The windiest place on Earth is Commonwealth Bay, Antarctica, with winds regularly over 150 mph! 🌪️",
        "Raindrops fall at an average speed of 14 mph (23 km/h). 🌧️💨",
        "The longest recorded dry period was 173 months in Arica, Chile! 🏜️",
        "A cubic mile of fog contains less than a gallon of water. 🌫️💧",
        "The coldest temperature ever recorded was -89.2°C (-128.6°F) at Vostok Station, Antarctica. ❄️🥶"
    ];
    
    // Initialize the app
    init();
    
    function init() {
        // Check if user has a preferred location in localStorage
        const savedLocation = localStorage.getItem('weatherLocation');
        if (savedLocation) {
            locationInput.value = savedLocation;
            fetchWeather(savedLocation);
        }
        
        // Event listeners
        searchBtn.addEventListener('click', () => {
            const location = locationInput.value.trim();
            if (location) {
                fetchWeather(location);
                // Save to localStorage
                localStorage.setItem('weatherLocation', location);
            } else {
                showError('Please enter a location');
            }
        });
        
        currentLocationBtn.addEventListener('click', getCurrentLocationWeather);
        
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
        
        // Display a random fun fact
        showRandomFunFact();
    }
    
    function getCurrentLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    showError('Unable to retrieve your location. Please enable location services or enter a location manually.');
                    console.error(error);
                }
            );
        } else {
            showError('Geolocation is not supported by your browser. Please enter a location manually.');
        }
    }
    
    async function fetchWeather(location) {
        showLoader();
        
        try {
            // First try to get coordinates for the location (for more accurate weather)
            const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`);
            const geoData = await geoResponse.json();
            
            if (geoData.length > 0) {
                const { lat, lon } = geoData[0];
                fetchWeatherByCoords(lat, lon, location);
            } else {
                showError('Location not found. Please try another location.');
                hideLoader();
            }
        } catch (error) {
            showError('Failed to fetch weather data. Please try again later.');
            console.error(error);
            hideLoader();
        }
    }
    
    async function fetchWeatherByCoords(lat, lon, locationName = null) {
        try {
            // Fetch current weather
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();
            
            // Fetch 5-day forecast
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
            const forecastData = await forecastResponse.json();
            
            // Process and display data
            displayWeather(weatherData, forecastData, locationName);
            hideLoader();
        } catch (error) {
            showError('Failed to fetch weather data. Please try again later.');
            console.error(error);
            hideLoader();
        }
    }
    
    function displayWeather(currentData, forecastData, locationName = null) {
        // Show the weather display if it's hidden
        weatherDisplay.style.display = 'block';
        
        // Update current weather
        const weatherCode = currentData.weather[0].id;
        weatherIcon.textContent = getWeatherEmoji(weatherCode);
        temperature.textContent = `${Math.round(currentData.main.temp)}°C`;
        weatherDescription.textContent = currentData.weather[0].description;
        humidity.textContent = `${currentData.main.humidity}%`;
        windSpeed.textContent = `${(currentData.wind.speed * 3.6).toFixed(1)} km/h`;
        pressure.textContent = `${currentData.main.pressure} hPa`;
        feelsLike.textContent = `${Math.round(currentData.main.feels_like)}°C`;
        visibility.textContent = `${(currentData.visibility / 1000).toFixed(1)} km`;
        
        // Convert sunrise/sunset times
        const sunriseTime = new Date(currentData.sys.sunrise * 1000);
        const sunsetTime = new Date(currentData.sys.sunset * 1000);
        sunrise.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunset.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Update forecast
        updateForecast(forecastData);
        
        // Change background gradient based on temperature
        updateBackground(currentData.main.temp);
        
        // Show a new fun fact
        showRandomFunFact();
    }
    
    function updateForecast(forecastData) {
        // Clear previous forecast cards
        forecastCards.innerHTML = '';
        
        // Group forecasts by day
        const dailyForecasts = {};
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString([], { weekday: 'short' });
            
            if (!dailyForecasts[day]) {
                dailyForecasts[day] = {
                    temps: [],
                    weatherCodes: []
                };
            }
            
            dailyForecasts[day].temps.push(item.main.temp);
            dailyForecasts[day].weatherCodes.push(item.weather[0].id);
        });
        
        // Get the next 5 days
        const next5Days = Object.keys(dailyForecasts).slice(0, 5);
        
        // Create forecast cards
        next5Days.forEach(day => {
            const dayData = dailyForecasts[day];
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            
            // Get most common weather condition for the day
            const mostCommonCode = mode(dayData.weatherCodes);
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card glow-on-hover';
            forecastCard.innerHTML = `
                <div class="forecast-day">${day}</div>
                <div class="forecast-icon">${getWeatherEmoji(mostCommonCode)}</div>
                <div class="forecast-temp">
                    <span class="forecast-high">${maxTemp}°</span>
                    <span class="forecast-low">${minTemp}°</span>
                </div>
            `;
            
            forecastCards.appendChild(forecastCard);
        });
    }
    
    function getWeatherEmoji(weatherCode) {
        // Weather code ranges from OpenWeatherMap
        if (weatherCode >= 200 && weatherCode < 300) {
            return '⛈️'; // Thunderstorm
        } else if (weatherCode >= 300 && weatherCode < 400) {
            return '🌧️'; // Drizzle
        } else if (weatherCode >= 500 && weatherCode < 600) {
            return '🌧️'; // Rain
        } else if (weatherCode >= 600 && weatherCode < 700) {
            return '❄️'; // Snow
        } else if (weatherCode >= 700 && weatherCode < 800) {
            return '🌫️'; // Atmosphere (fog, haze, etc.)
        } else if (weatherCode === 800) {
            return '☀️'; // Clear
        } else if (weatherCode > 800 && weatherCode < 900) {
            return '☁️'; // Clouds
        } else {
            return '🌈'; // Default
        }
    }
    
    function updateBackground(temp) {
        // Change gradient based on temperature
        let primary, secondary;
        
        if (temp < 0) {
            // Very cold
            primary = '#4b6cb7';
            secondary = '#182848';
        } else if (temp < 10) {
            // Cold
            primary = '#1e3c72';
            secondary = '#2a5298';
        } else if (temp < 20) {
            // Cool
            primary = '#2193b0';
            secondary = '#6dd5ed';
        } else if (temp < 30) {
            // Warm
            primary = '#ff9a9e';
            secondary = '#fad0c4';
        } else {
            // Hot
            primary = '#ff512f';
            secondary = '#dd2476';
        }
        
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--secondary-color', secondary);
        document.documentElement.style.setProperty('--glow-color', `${primary}80`);
    }
    
    function showRandomFunFact() {
        const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
        funFact.innerHTML = `<p>${randomFact}</p>`;
    }
    
    function showLoader() {
        weatherDisplay.style.display = 'none';
        // In a real app, you'd show a loading spinner here
    }
    
    function hideLoader() {
        // Hide loading spinner
    }
    
    function showError(message) {
        // In a real app, you'd show an error message to the user
        console.error(message);
    }
    
    // Helper function to find mode (most common element) in an array
    function mode(array) {
        const count = {};
        array.forEach(item => {
            count[item] = (count[item] || 0) + 1;
        });
        
        let maxCount = 0;
        let modeValue;
        
        for (const key in count) {
            if (count[key] > maxCount) {
                maxCount = count[key];
                modeValue = key;
            }
        }
        
        return modeValue;
    }
    
    // Create particle effect
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random properties
            const size = Math.random() * 5 + 2;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = Math.random() * 20 + 10;
            const opacity = Math.random() * 0.5 + 0.1;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.opacity = opacity;
            particle.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Initialize particles
    createParticles();
});
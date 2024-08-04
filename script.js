const apiKey = 'AIzaSyBCxIi372xY9S5t6VMpGNg3Lo2Pm62kjYQ';
const spreadsheetId = '1tyL8BW3o54H_tvWGbKFVrQQuzXSG741LwjAx0uIP33s';
const sheets = [
    { name: 'AU Locations CSV', displayName: 'Australia', flagIcon: 'au', countryCode: 'AU' },
    { name: 'US Locations', displayName: 'USA', flagIcon: 'us', countryCode: 'US' },
    { name: 'EURO Locations', displayName: 'Europe', flagIcon: 'eu', countryCode: 'EU' },
    { name: 'NZ Locations', displayName: 'New Zealand', flagIcon: 'nz', countryCode: 'NZ' },
    { name: 'MX location', displayName: 'Mexico', flagIcon: 'mx', countryCode: 'MX' },
    { name: 'TW Location', displayName: 'Taiwan', flagIcon: 'tw', countryCode: 'TW' }
];

async function fetchLocations() {
    const promises = sheets.map(sheet => {
        const range = `${sheet.name}!A:H`;
        const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        return fetch(endpoint).then(response => response.json()).then(data => ({ sheet, data }));
    });

    try {
        const results = await Promise.all(promises);
        results.forEach(result => {
            if (result.data.values) {
                displayLocations(result.data.values, result.sheet.displayName, result.sheet.flagIcon);
            } else {
                console.error(`No data found for sheet: ${result.sheet.displayName}`);
            }
        });

        addSearchFunctionality();
        await activateTabBasedOnLocation();
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

async function activateTabBasedOnLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const countryCode = await getCountryCodeFromCoordinates(latitude, longitude);
            activateTabByCountryCode(countryCode);
        }, (error) => {
            console.error('Geolocation error:', error);
            activateDefaultTab();
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        activateDefaultTab();
    }
}

async function getCountryCodeFromCoordinates(latitude, longitude) {
    const endpoint = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        return data.countryCode;
    } catch (error) {
        console.error('Error fetching country code:', error);
        return null;
    }
}

function activateTabByCountryCode(countryCode) {
    const sheet = sheets.find(sheet => sheet.countryCode === countryCode);
    if (sheet) {
        const continentId = sheet.displayName.replace(/\s+/g, '-').toLowerCase();
        activateTab(continentId);

        const tabDropdown = document.getElementById('tab-dropdown');
        if (tabDropdown) {
            tabDropdown.value = continentId;
        }
    } else {
        activateDefaultTab();
    }
}

function activateDefaultTab() {
    console.log('Activating default tab: Australia');
    const auSheet = sheets.find(sheet => sheet.countryCode === 'AU');
    const continentId = auSheet.displayName.replace(/\s+/g, '-').toLowerCase();
    activateTab(continentId);

    const tabDropdown = document.getElementById('tab-dropdown');
    if (tabDropdown) {
        tabDropdown.value = continentId;
    }
}

function activateTab(tabId) {
    console.log('Activating tab:', tabId);
    const tabs = document.querySelectorAll('.tab');
    const locations = document.querySelectorAll('.location');

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });

    locations.forEach(location => {
        location.classList.remove('active');
        if (location.id === tabId) {
            location.classList.add('active');
        }
    });
}

function filterByState(tabId, state) {
    const locationDivs = document.querySelectorAll(`#${tabId} .location-content`);

    locationDivs.forEach(locationDiv => {
        const locationState = locationDiv.getAttribute('data-state');
        if (locationState === state || state === '') {
            locationDiv.style.display = '';
        } else {
            locationDiv.style.display = 'none';
        }
    });
}

function addSearchFunctionality() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const filter = searchInput.value.toLowerCase();
            const locationDivs = document.querySelectorAll('.location-content');

            locationDivs.forEach(locationDiv => {
                const textContent = locationDiv.textContent.toLowerCase();
                if (textContent.includes(filter)) {
                    locationDiv.style.display = '';
                } else {
                    locationDiv.style.display = 'none';
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', fetchLocations);

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
        const range = `${sheet.name}!A:H`;  // Ensure we fetch columns A to H
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
        await activateTabBasedOnLocation(); // Activate the tab based on user's location
    } catch (error) {
        console.error('Error fetching locations:', error);
    }
}

function displayLocations(locations, sheetDisplayName, flagIcon) {
    const tabList = document.getElementById('tab-list');
    const tabContent = document.getElementById('tab-content');
    const tabDropdown = document.getElementById('tab-dropdown');

    if (!tabList || !tabContent || !tabDropdown) {
        console.error('Required DOM elements not found');
        return;
    }

    const continentHeader = document.createElement('li');
    const continentDropdownOption = document.createElement('option');
    const continentTabContent = document.createElement('div');
    const stateFilters = new Set();

    let openLocationsCount = 0;

    const continentId = sheetDisplayName.replace(/\s+/g, '-').toLowerCase();
    continentHeader.className = 'tab';
    continentHeader.innerHTML = `${sheetDisplayName}<br><span class="flag-icon flag-icon-${flagIcon}"></span>`;
    continentHeader.setAttribute('data-tab', continentId);
    continentHeader.onclick = () => activateTab(continentId);

    continentDropdownOption.value = continentId;
    continentDropdownOption.innerHTML = `${sheetDisplayName} <span class="flag-icon flag-icon-${flagIcon}"></span>`;

    continentTabContent.id = continentId;
    continentTabContent.className = 'location';

    locations.forEach((location, index) => {
        if (index === 0) {
            console.log(`Header Row: ${location}`);
            return; // Skip header row
        }

        const [state, name, url, address, notes, mapLocation, country, open] = location;

        console.log(`Sheet: ${sheetDisplayName}, Row: ${index}, Open: ${open}, Country: ${country}, StoreName: ${name}`);

        if (open === 'TRUE') {  // Check if the value is 'TRUE'
            openLocationsCount++;
            stateFilters.add(state);

            const locationDiv = document.createElement('div');
            locationDiv.className = `location-content ${index % 2 === 0 ? 'even' : 'odd'}`;
            locationDiv.setAttribute('data-state', state);

            locationDiv.innerHTML = `
                <h2>${name}</h2>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Notes:</strong> ${notes}</p>
                <p><strong>Opening Hours:</strong> <a href="${url}" target="_blank">View Opening Hours</a></p>
                <p>${mapLocation}</p>
            `;

            continentTabContent.appendChild(locationDiv);
        }
    });

    if (openLocationsCount > 0) {
        // Create a state filter dropdown for mobile
        const stateFilterDropdown = document.createElement('select');
        stateFilterDropdown.className = 'state-filter-dropdown';
        stateFilterDropdown.innerHTML = `<option value="">All States</option>`;
        stateFilters.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateFilterDropdown.appendChild(option);
        });
        stateFilterDropdown.onchange = () => filterByState(continentId, stateFilterDropdown.value);

        // Create the state filter buttons for desktop
        const stateFilterContainer = document.createElement('div');
        stateFilterContainer.className = 'state-filters';
        stateFilterContainer.innerHTML = `<strong>Filter by State:</strong>`;
        stateFilters.forEach(state => {
            const button = document.createElement('button');
            button.textContent = state;
            button.onclick = () => filterByState(continentId, state);
            stateFilterContainer.appendChild(button);
        });

        const storeCount = document.createElement('p');
        storeCount.innerHTML = `<strong>Total stores: ${openLocationsCount}</strong>`;
        continentTabContent.prepend(storeCount);
        continentTabContent.prepend(stateFilterContainer);
        continentTabContent.prepend(stateFilterDropdown);

        tabList.appendChild(continentHeader);
        tabDropdown.appendChild(continentDropdownOption);
        tabContent.appendChild(continentTabContent);
    }

    tabDropdown.onchange = () => activateTab(tabDropdown.value);
}

async function activateTabBasedOnLocation() {
    try {
        const response = await fetch('https://geolocation-db.com/json/');
        const locationData = await response.json();
        const userCountryCode = locationData.country_code;

        const sheet = sheets.find(sheet => sheet.countryCode === userCountryCode);
        if (sheet) {
            const continentId = sheet.displayName.replace(/\s+/g, '-').toLowerCase();
            activateTab(continentId);

            // Set the dropdown to the user's location
            const tabDropdown = document.getElementById('tab-dropdown');
            if (tabDropdown) {
                tabDropdown.value = continentId;
            }
        } else {
            const firstTab = document.querySelector('.tab');
            if (firstTab) {
                activateTab(firstTab.getAttribute('data-tab')); // Default to first tab if no match found
            }
        }
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        const firstTab = document.querySelector('.tab');
        if (firstTab) {
            activateTab(firstTab.getAttribute('data-tab')); // Default to first tab if geolocation fails
        }
    }
}

function activateTab(tabId) {
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

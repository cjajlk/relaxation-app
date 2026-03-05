const backButton = document.getElementById('back-button');
const progressChartCanvas = document.getElementById('progressChart');
const badgesShowcase = document.getElementById('badges-showcase');

// Load data from localStorage
const sessionDates = JSON.parse(localStorage.getItem('sessionDates') || '[]');
const badges = JSON.parse(localStorage.getItem('badges') || '[]');
const badgeDates = JSON.parse(localStorage.getItem('badgeDates') || '{}');

// Back button event listener
backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Function to generate progress chart
function generateProgressChart() {
    const ctx = progressChartCanvas.getContext('2d');

    // Count sessions per date
    const dateCounts = {};
    sessionDates.forEach(date => {
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const labels = Object.keys(dateCounts).sort();
    const data = labels.map(date => dateCounts[date]);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sessions par Jour',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de Sessions'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

// Function to display badges showcase
function displayBadgesShowcase() {
    badgesShowcase.innerHTML = '';
    badges.forEach(badge => {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'badge-item';
        badgeDiv.innerHTML = `
            <div>${badge}</div>
            <div style="font-size: 0.8em;">Obtenu le: ${badgeDates[badge] || 'N/A'}</div>
        `;
        badgesShowcase.appendChild(badgeDiv);
    });
}

// Initialize the page
generateProgressChart();
displayBadgesShowcase();

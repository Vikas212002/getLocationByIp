document.getElementById('getLocationBtn').addEventListener('click', async () => {
    const output = document.getElementById('output');
    output.innerHTML = "Getting location...";

    let locationData = null;

    // Try browser geolocation first
    if (navigator.geolocation) {
        try {
            locationData = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    position => resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        source: 'GPS'
                    }),
                    () => reject('denied')
                );
            });
        } catch (err) {
            console.warn("⚠️ Geolocation denied. Using IP-based location...");
        }
    }

    // If geolocation failed or denied, use IP lookup
    if (!locationData) {
        try {
            const res = await fetch('/api/location');
            const data = await res.json();
            locationData = {
                city: data.city || "N/A",
                region: data.region || "N/A",
                country: data.country || "N/A",
                latitude: data.latitude,
                longitude: data.longitude,
                source: 'IP'
            };
        } catch (error) {
            output.innerHTML = "❌ Failed to get location.";
            return;
        }
    }

    // Show result only once
    output.innerHTML = `
        Source: ${locationData.source}<br>
        City: ${locationData.city || "N/A"}<br>
        Region: ${locationData.region || "N/A"}<br>
        Country: ${locationData.country || "N/A"}<br>
        Latitude: ${locationData.latitude}<br>
        Longitude: ${locationData.longitude}
    `;
});

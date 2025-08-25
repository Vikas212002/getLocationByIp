const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get location by IP
router.get('/ip/:ip?', async (req, res) => {
  try {
    const clientIP = req.params.ip || 
                    req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.message.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.message.socket ? req.message.socket.remoteAddress : null);

    // Multiple IP geolocation services for fallback
    const ipServices = [
      `https://ipapi.co/${clientIP}/json/`,
      `https://ip-api.com/json/${clientIP}`,
      `https://ipwhois.app/json/${clientIP}`
    ];

    let locationData = null;
    let serviceUsed = '';

    // Try each service until one works
    for (let i = 0; i < ipServices.length; i++) {
      try {
        const response = await axios.get(ipServices[i], { timeout: 5000 });
        
        if (i === 0) { // ipapi.co format
          if (!response.data.error) {
            locationData = {
              ip: response.data.ip,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
              city: response.data.city,
              region: response.data.region,
              country: response.data.country_name,
              address: `${response.data.city}, ${response.data.region}, ${response.data.country_name}`,
              isp: response.data.org,
              timezone: response.data.timezone
            };
            serviceUsed = 'ipapi.co';
            console.log('ipapi.co response:', response.data);
            break;
          }
        } else if (i === 1) { // ip-api.com format
          if (response.data.status === 'success') {
            locationData = {
              ip: response.data.query,
              latitude: response.data.lat,
              longitude: response.data.lon,
              city: response.data.city,
              region: response.data.regionName,
              country: response.data.country,
              address: `${response.data.city}, ${response.data.regionName}, ${response.data.country}`,
              isp: response.data.isp,
              timezone: response.data.timezone,
              postalCode: response.data.zip || null
            };
            serviceUsed = 'ip-api.com';
            console.log('ip-api.com response:', response.data);

            break;
          }
        } else if (i === 2) { // ipwhois.app format
          if (response.data.success) {
            locationData = {
              ip: response.data.ip,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
              city: response.data.city,
              region: response.data.region,
              country: response.data.country,
              address: `${response.data.city}, ${response.data.region}, ${response.data.country}`,
              isp: response.data.isp,
              timezone: response.data.timezone,
              
            };
            serviceUsed = 'ipwhois.app';
            console.log('ipwhois.app response:', response.data);
            break;
          }
        }
      } catch (serviceError) {
        console.log(`Service ${ipServices[i]} failed:`, serviceError.message);
        continue;
      }
    }

    if (!locationData) {
      return res.status(503).json({ 
        error: 'All IP geolocation services are unavailable',
        ip: clientIP
      });
    }

    res.json({
      success: true,
      source: 'IP',
      service: serviceUsed,
      data: locationData
    });

  } catch (error) {
    console.error('IP location error:', error);
    res.status(500).json({ 
      error: 'Failed to get IP location',
      message: error.message 
    });
  }
});

// Reverse geocoding for GPS coordinates
router.post('/geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    // OpenStreetMap Nominatim API for reverse geocoding
    const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const response = await axios.get(geocodeUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'LocationTrackerApp/1.0'
      }
    });

    const geocodeData = response.data;
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: geocodeData.display_name || `${latitude}, ${longitude}`,
      city: geocodeData.address?.city || 
            geocodeData.address?.town || 
            geocodeData.address?.village || 'Unknown',
      region: geocodeData.address?.state || 
              geocodeData.address?.region || 'Unknown',
      country: geocodeData.address?.country || 'Unknown',
      postalCode: geocodeData.address?.postcode || null
    };

    console.log('Geocoding result:', locationData);

    res.json({
      success: true,
      source: 'GPS',
      data: locationData
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      error: 'Failed to geocode coordinates',
      message: error.message 
    });
  }
});

module.exports = router;
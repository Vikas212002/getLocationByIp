import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class LocationService {
  // Get location by public IP
  async getIPLocation() {
    try {
      // 1. Get public IP from client
      const ipRes = await axios.get("https://api.ipify.org?format=json", {
        timeout: 10000,
      });
      const clientIP = ipRes.data?.ip;
      if (!clientIP) {
        throw new Error("Could not retrieve client IP address");
      }

      // 2. Send public IP to backend for location lookup
      const response = await axios.get(
        `${API_BASE_URL}/location/ip/${clientIP}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get IP location"
      );
    }
  }

  // Get GPS location with browser API
  async getGPSLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;

            // Get address from coordinates via backend
            const addressResponse = await axios.post(
              `${API_BASE_URL}/location/geocode`,
              {
                latitude,
                longitude,
              },
              { timeout: 10000 }
            );

            console.log("Raw GPS coords:", position.coords);
            console.log("Accuracy (meters):", position.coords.accuracy);

            resolve({
              success: true,
              source: "GPS",
              data: {
                ...addressResponse.data.data,
                accuracy,
              },
            });
          } catch (error) {
            // If geocoding fails, still return coordinates
            resolve({
              success: true,
              source: "GPS",
              data: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                address: `${position.coords.latitude.toFixed(
                  4
                )}, ${position.coords.longitude.toFixed(4)}`,
              },
            });
          }
        },
        (error) => {
          reject(new Error(`GPS Error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        }
      );
    });
  }

  // Fallback to client-side IP location (if backend is down)
  async getClientIPLocation() {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.reason);
      }

      return {
        success: true,
        source: "IP",
        service: "ipapi.co",
        data: {
          ip: data.ip,
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          region: data.region,
          country: data.country_name,
          address: `${data.city}, ${data.region}, ${data.country_name}`,
          isp: data.org,
          timezone: data.timezone,
        },
      };
    } catch (error) {
      throw new Error("Failed to get location via client-side IP lookup");
    }
  }
}

export default new LocationService();

import { useState, useEffect } from 'react'
import { MapPin, Wifi, Satellite, RefreshCw, AlertCircle, Globe, Clock } from 'lucide-react'
import locationService from '../services/locationService'

const LocationTracker = () => {
  const [locationData, setLocationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Function to get IP-based location
  const getIPLocation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try backend first, fallback to client-side
      let response
      try {
        response = await locationService.getIPLocation()
      } catch (backendError) {
        console.log('Backend unavailable, using client-side IP lookup')
        response = await locationService.getClientIPLocation()
      }

      setLocationData(response.data)
      setSource('IP')
      setLastUpdated(new Date())
    } catch (err) {
      setError(`IP Location Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Function to get GPS location
  const getGPSLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await locationService.getGPSLocation()
      setLocationData(response.data)
      setSource('GPS')
      setLastUpdated(new Date())
    } catch (err) {
      setError(`GPS Access Denied: ${err.message}`)
      // Fallback to IP location
      await getIPLocation()
    } finally {
      setLoading(false)
    }
  }

  // Initial load - try GPS first
  useEffect(() => {
    getGPSLocation()
  }, [])

  const refreshLocation = () => {
    if (source === 'GPS') {
      getGPSLocation()
    } else {
      getIPLocation()
    }
  }

  const switchToIP = () => {
    getIPLocation()
  }

  const switchToGPS = () => {
    getGPSLocation()
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Location Tracker</h1>
          <p className="text-gray-600">Get your current location using GPS or IP geolocation</p>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              {source === 'GPS' ? (
                <Satellite className="w-6 h-6 text-green-600" />
              ) : (
                <Wifi className="w-6 h-6 text-blue-600" />
              )}
              <span className="text-lg font-semibold text-gray-700">
                Source: 
                {source === 'GPS' && <span className="text-green-600 ml-1">GPS Location</span>}
                {source === 'IP' && <span className="text-blue-600 ml-1">IP Geolocation</span>}
              </span>
            </div>
            
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {formatTime(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 animate-fadeIn">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={refreshLocation}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Location</span>
            </button>
            
            <button
              onClick={switchToGPS}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Satellite className="w-5 h-5" />
              <span>Use GPS</span>
            </button>
            
            <button
              onClick={switchToIP}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Wifi className="w-5 h-5" />
              <span>Use IP Location</span>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Getting your location...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">Error getting location</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Location Data */}
          {locationData && !loading && (
            <div className="space-y-6 animate-fadeIn">
              {/* Coordinates Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Latitude
                  </h3>
                  <p className="text-3xl font-bold text-blue-700">
                    {locationData.latitude?.toFixed(6)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Longitude
                  </h3>
                  <p className="text-3xl font-bold text-green-700">
                    {locationData.longitude?.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Full Address */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-semibold text-gray-700 mb-3">Full Address</h3>
                <p className="text-lg text-gray-800 leading-relaxed">{locationData.address}</p>
              </div>

              {/* Location Details Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">City</h3>
                  <p className="text-gray-800">{locationData.city || 'Unknown'}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Region</h3>
                  <p className="text-gray-800">{locationData.region || 'Unknown'}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Country</h3>
                  <p className="text-gray-800">{locationData.country || 'Unknown'}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid md:grid-cols-2 gap-4">
                {source === 'IP' && locationData.ip && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">IP Address</h3>
                    <p className="text-gray-800 font-mono">{locationData.ip}</p>
                  </div>
                )}
                
                {source === 'GPS' && locationData.accuracy && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">GPS Accuracy</h3>
                    <p className="text-gray-800">{Math.round(locationData.accuracy)} meters</p>
                  </div>
                )}
                
                {locationData.isp && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Internet Provider</h3>
                    <p className="text-gray-800">{locationData.isp}</p>
                  </div>
                )}
                
                {locationData.timezone && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">Timezone</h3>
                    <p className="text-gray-800">{locationData.timezone}</p>
                  </div>
                )}
                {locationData.postalCode && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">PostalCode</h3>
                    <p className="text-gray-800">{locationData.postalCode}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm animate-fadeIn">
          <p className="mb-2">🔒 Your location data is processed securely and not stored on any server.</p>
          <p>Built with React + Vite & Node.js • GPS + IP Geolocation</p>
        </div>
      </div>
    </div>
  )
}

export default LocationTracker
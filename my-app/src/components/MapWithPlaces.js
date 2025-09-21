import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '12px' };
// Coordinates for Juhu, Mumbai
const defaultCenter = { lat: 19.0945, lng: 72.8252 };

// Custom marker icons
const userLocationIcon = {
  url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQyODVGNCI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiLz48L3N2Zz4=',
  scaledSize: { width: 30, height: 30 },
  anchor: { x: 15, y: 15 }
};

const hospitalIcon = {
  url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI0VBNEMzNSI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCA2aC00VjRjMC0xLjEtLjktMi0yLTJoLTRjLTEuMSAwLTIgLjktMiAydjJINGMtMS4xIDAtMiAuOS0yIDJ2MTRjMCAxLjEuOSAyIDIgMmgxNmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yem0tNiAwaC00VjRoNHYyeiIvPjxwYXRoIGQ9Ik0xOCAxNGgtLjc3di0uNzNjMC0uOTEtLjY0LTEuNjktMS41LTEuODV2LS45MmgxYy44MyAwIDEuNS0uNjcgMS41LTEuNVY4YzAtLjgzLS42Ny0xLjUtMS41LTEuNUg2Yy0uODMgMC0xLjUuNjctMS41IDEuNXYyLjkyYzAgLjgzLjY3IDEuNSAxLjUgMS41aDF2LjkyYy0uODYuMTYtMS41Ljk0LTEuNSAxLjg1di43M0g2di01aDEydjV6Ii8+PC9zdmc+',
  scaledSize: { width: 24, height: 24 },
  anchor: { x: 12, y: 12 }
};

export default function MapWithPlaces({ userLocation, specialty }) {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDtx8c6CAwVN2W1-p4gZ-v9JejhBxHMQZ8',
    libraries: ['places']
  });

  const fetchNearbyHospitals = useCallback((map) => {
    if (!userLocation || !map || !specialty) return;
    
    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: userLocation,
      radius: 5000, 
      keyword: `${specialty} hospital clinic`,
      type: 'hospital'
    };
    
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results.slice(0, 8));
      } else {
        console.error('Places API error:', status);
        // Fallback to some default hospitals if API fails
        setPlaces([
          {
            place_id: '1',
            name: 'Kokilaben Dhirubhai Ambani Hospital',
            geometry: { location: { lat: () => 19.1310500, lng: () => 72.8250528 } },
            vicinity: 'Four Bungalows, Andheri West'
          },
          {
            place_id: '2',
            name: 'Lilavati Hospital and Research Centre',
            geometry: { location: { lat: () => 19.050995, lng: () => 72.82925 } },
            vicinity: 'Bandra West'
          },
          {
            place_id: '3',
            name: 'Nanavati Hospital',
            geometry: { location: { lat: () => 19.095786, lng: () => 72.839986 } },
            vicinity: 'Vile Parle West'
          }
        ]);
      }
    });
  }, [userLocation, specialty]);

  const getDirections = (place) => {
    if (!userLocation) return;
    
    const destLat = place.geometry.location.lat();
    const destLng = place.geometry.location.lng();
    
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`,
      '_blank'
    );
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);
    fetchNearbyHospitals(map);
  }, [fetchNearbyHospitals]);

  useEffect(() => {
    if (map && userLocation && specialty) {
      fetchNearbyHospitals(map);
    }
  }, [map, userLocation, specialty, fetchNearbyHospitals]);

  if (loadError) {
    return (
      <div className="map-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Error loading maps. Please check your internet connection.</p>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="map-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading map…</p>
      </div>
    );
  }

  const center = userLocation || defaultCenter;

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={center}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi.medical",
              elementType: "labels.icon",
              stylers: [{ visibility: "on" }]
            }
          ]
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={userLocationIcon}
            title="Your location"
            onClick={() => setSelectedPlace({
              name: "Your Location",
              geometry: { location: userLocation }
            })}
          />
        )}
        
        {places.map(place => (
          <Marker
            key={place.place_id}
            position={place.geometry.location}
            icon={hospitalIcon}
            title={place.name}
            onClick={() => setSelectedPlace(place)}
          />
        ))}
        
        {selectedPlace && (
          <InfoWindow
            position={selectedPlace.geometry.location}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="info-window">
              <h3>{selectedPlace.name}</h3>
              {selectedPlace.vicinity && <p>{selectedPlace.vicinity}</p>}
              {userLocation && (
                <button 
                  className="direction-btn"
                  onClick={() => getDirections(selectedPlace)}
                >
                  <i className="fas fa-directions"></i> Get Directions
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      <div className="hospital-list">
        <h3>Nearby {specialty} Facilities</h3>
        {places.length === 0 ? (
          <p className="no-hospitals">Loading nearby hospitals...</p>
        ) : (
          <div className="hospital-cards">
            {places.map(place => (
              <div key={place.place_id} className="hospital-card">
                <div className="hospital-info">
                  <h4>{place.name}</h4>
                  <p className="hospital-address">{place.vicinity || "Address not available"}</p>
                </div>
                {userLocation && (
                  <button 
                    className="direction-btn small"
                    onClick={() => getDirections(place)}
                    title="Get directions"
                  >
                    <i className="fas fa-directions"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
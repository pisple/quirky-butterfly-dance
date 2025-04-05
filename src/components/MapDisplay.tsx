
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

interface MapDisplayProps {
  location: string;
  onClose: () => void;
}

const MapDisplay = ({ location, onClose }: MapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);

  const handleTokenInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapboxToken(e.target.value);
  };

  const validateAndSaveToken = () => {
    if (mapboxToken) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setIsTokenValid(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    const token = localStorage.getItem('mapbox_token') || mapboxToken;
    if (!token) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        zoom: 12,
        center: [2.3522, 48.8566], // Default to Paris
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Try to geocode the city
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].center;
            
            map.current?.setCenter(coordinates);
            
            new mapboxgl.Marker()
              .setLngLat(coordinates)
              .addTo(map.current as mapboxgl.Map);
          }
        })
        .catch(error => {
          console.error("Erreur lors de la géolocalisation:", error);
        });
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
      setIsTokenValid(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setIsTokenValid(true);
    }
  }, []);

  useEffect(() => {
    if (isTokenValid) {
      initializeMap();
    }
  }, [isTokenValid, location]);

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white p-4 rounded-lg w-[90%] max-w-3xl max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin size={20} />
            Localisation: {location}
          </h2>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
        
        {!isTokenValid ? (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Pour utiliser la carte, veuillez entrer votre clé API Mapbox publique. 
              <br />Vous pouvez en obtenir une gratuitement sur <a href="https://mapbox.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">mapbox.com</a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={mapboxToken}
                onChange={handleTokenInput}
                placeholder="Entrez votre clé API Mapbox"
                className="flex-1 p-2 border rounded"
              />
              <Button onClick={validateAndSaveToken}>Valider</Button>
            </div>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-[60vh] rounded-md"></div>
        )}
      </div>
    </div>
  );
};

export default MapDisplay;

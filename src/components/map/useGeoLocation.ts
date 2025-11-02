import { useEffect, useState } from "react";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationState {
  loaded: boolean;
  coordinates?: Coordinates;
  error?: {
    code: number;
    message: string;
  };
}

const useGeoLocation = (): LocationState => {
  const [location, setLocation] = useState<LocationState>({
    loaded: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation({
        loaded: true,
        error: { code: 0, message: "Geolocation not supported" },
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          loaded: true,
          coordinates: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
      },
      (error) => {
        setLocation({
          loaded: true,
          error: { code: error.code, message: error.message },
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return location;
    };

export default useGeoLocation;

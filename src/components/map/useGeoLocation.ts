import { useEffect, useState } from "react";

    interface Coordinates {
        lat: number;
        lng: number;
    }

    interface LocationState {
        loaded: boolean;
        coordinates: Coordinates;
        error?: {
            code: number;
            message: string;
        };
    }

const useGeoLocation = (): LocationState => {
    const [location, setLocation] = useState<LocationState>({
        loaded: false,
        coordinates: { lat: 0, lng: 0 }
    });

    const onSuccess = (pos : GeolocationPosition) => {
        setLocation({
            loaded: true,
            coordinates: { 
                lat: pos.coords.latitude, 
                lng: pos.coords.longitude }
        });
    }
    const onError = (error : GeolocationPositionError) => {
        setLocation({
            loaded: true,
            coordinates: { lat: 0, lng: 0 },
            error: { code: error.code, message: error.message }
        });
    }

    useEffect(() => {
        if (!("geolocation" in navigator)){ // check xem trình duyệt có hỗ trợ navigator.geolocation không

            onError({ code: 0, message: "Geolocation not supported" } as GeolocationPositionError);
            return;
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }, []);

    return location;

}

export default useGeoLocation;
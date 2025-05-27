import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { getGoogleMapsApiKey } from "@/lib/utils";

type LatLng = { lat: number; lng: number };
type Property = {
  id: string;
  user_id: string;
  price: string;
  image: string;
  lat: number;
  lng: number;
  imageUrl: string;
};
type ModalData = Property | null;

type MapViewProps = {
  properties: Property[];
  setModalData: (data: Property | null) => void;
  setClickedPosition: (pos: LatLng) => void;
  setShowModal: (show: boolean) => void;
  ignoreNextMapClick: boolean;
  setIgnoreNextMapClick: (v: boolean) => void;
};

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: 40.759,
  lng: -73.9845,
};

export default function MapView({
  properties,
  setModalData,
  setClickedPosition,
  setShowModal,
  ignoreNextMapClick,
  setIgnoreNextMapClick,
}: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getGoogleMapsApiKey(),
  });
  function formatPrice(value: string) {
    if (!value) return "";
    return Number(value).toLocaleString();
  }
  if (!isLoaded) return <div>Loading...</div>;
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onClick={(e) => {
        if (ignoreNextMapClick) {
          setIgnoreNextMapClick(false);
          return;
        }
        setClickedPosition({
          lat: e.latLng?.lat() ?? 0,
          lng: e.latLng?.lng() ?? 0,
        });
        setShowModal(true);
      }}
    >
      {properties.map((property) => (
        <OverlayView
          key={property.id}
          position={{ lat: property.lat, lng: property.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <Button
            className="bg-black text-white rounded-full px-4 py-2 font-bold shadow z-10"
            style={{ minWidth: 80, minHeight: 40 }}
            onClick={(e) => {
              e.stopPropagation();
              setIgnoreNextMapClick(true);
              setModalData(property);
            }}
          >
            $ {formatPrice(property.price)}
          </Button>
        </OverlayView>
      ))}
    </GoogleMap>
  );
}

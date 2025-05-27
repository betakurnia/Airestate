import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { getGoogleMapsApiKey } from "@/lib/utils";

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
}: any) {
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
      {properties.map((property: any) => (
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
              setModalData({
                image: property.imageUrl,
                price: property.price,
              });
            }}
          >
            $ {formatPrice(property.price)}
          </Button>
        </OverlayView>
      ))}
    </GoogleMap>
  );
}

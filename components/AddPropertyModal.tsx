import { getSupabaseClient } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";

type LatLng = { lat: number; lng: number };

type AddPropertyModalProps = {
  setShowModal: (show: boolean) => void;
  price: string;
  setPrice: (v: string) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  success: string;
  setSuccess: (v: string) => void;
  clickedPosition: LatLng | null;
  setClickedPosition: (v: LatLng | null) => void;
};

export default function AddPropertyModal({
  setShowModal,
  price,
  setPrice,
  imageFile,
  setImageFile,
  loading,
  setLoading,
  error,
  setError,
  success,
  setSuccess,
  clickedPosition,
  setClickedPosition,
}: AddPropertyModalProps) {
  const [errorToast, setErrorToast] = useState("");
  const errorToastRef = useRef<HTMLDivElement>(null);

  function showErrorToast(msg: string) {
    setErrorToast(msg);
    if (errorToastRef.current) errorToastRef.current.style.opacity = "1";
    setTimeout(() => {
      if (errorToastRef.current) errorToastRef.current.style.opacity = "0";
      setTimeout(() => setErrorToast(""), 500);
    }, 2000);
  }

  async function getUserId() {
    const { data, error } = await getSupabaseClient().auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!price || Number(price) <= 0) {
      showErrorToast("Please enter a valid price.");
      return;
    }
    if (!imageFile) {
      showErrorToast("Please select an image file.");
      return;
    }
    if (!clickedPosition) {
      showErrorToast("Please click on the map to select a location.");
      return;
    }
    setLoading(true);
    const userId = await getUserId();
    if (!userId) {
      showErrorToast("You must be logged in to add a property.");
      setLoading(false);
      return;
    }
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;
    const { error: uploadError } = await getSupabaseClient()
      .storage.from("images")
      .upload(filePath, imageFile);
    if (uploadError) {
      showErrorToast("Image upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }
    const { error: insertError } = await getSupabaseClient()
      .from("users")
      .insert({
        user_id: userId,
        price,
        image: filePath,
        lat: clickedPosition.lat,
        lng: clickedPosition.lng,
      });
    if (insertError) {
      showErrorToast(insertError.message);
    } else {
      setSuccess("Property added!");
      setShowModal(false);
      setPrice("");
      setImageFile(null);
      setClickedPosition(null);
    }
    setLoading(false);
  }
  function formatPrice(value: string) {
    if (!value) return "";
    return Number(value).toLocaleString();
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={() => setShowModal(false)}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Add Property</h2>
        {errorToast && (
          <div
            ref={errorToastRef}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-500"
            style={{ opacity: 1 }}
          >
            {errorToast}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            Price
            <Input
              type="number"
              min={0}
              value={price}
              onKeyDown={(e) =>
                (e.key === "-" ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === ".") &&
                e.preventDefault()
              }
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) setPrice(val);
                else if (val === "") setPrice("");
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            Image
            <div className="relative">
              <input
                id="add-image-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  document.getElementById("add-image-input")?.click()
                }
              >
                Choose File
              </Button>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {imageFile ? `Selected: ${imageFile.name}` : "No file chosen"}
            </span>
          </label>
          <div>
            <div>Latitude: {clickedPosition?.lat ?? "Click map to select"}</div>
            <div>
              Longitude: {clickedPosition?.lng ?? "Click map to select"}
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}

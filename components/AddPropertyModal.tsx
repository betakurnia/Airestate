import { supabase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  async function getUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const userId = await getUserId();
    if (!userId) {
      setError("You must be logged in to add a property.");
      setLoading(false);
      return;
    }
    if (!imageFile) {
      setError("Please select an image file.");
      setLoading(false);
      return;
    }
    if (!clickedPosition) {
      setError("Please click on the map to select a location.");
      setLoading(false);
      return;
    }
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile);
    if (uploadError) {
      setError("Image upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }
    const { error: insertError } = await supabase.from("users").insert({
      user_id: userId,
      price,
      image: filePath,
      lat: clickedPosition.lat,
      lng: clickedPosition.lng,
    });
    if (insertError) {
      setError(insertError.message);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            Price
            <Input
              type="number"
              min={1}
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
                if (/^\d*$/.test(val) && Number(val) > 0) setPrice(val);
                else if (val === "") setPrice("");
              }}
              required
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
                required
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
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
        </form>
      </div>
    </div>
  );
}

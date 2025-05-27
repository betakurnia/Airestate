import { supabase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";

type Property = {
  id: string;
  user_id: string;
  price: string;
  image: string;
  lat: number;
  lng: number;
  imageUrl: string;
};

type EditPropertyModalProps = {
  editModalData: Property | null;
  setEditModalData: (v: Property | null) => void;
  editPrice: string;
  setEditPrice: (v: string) => void;
  editLat: number;
  setEditLat: (v: number) => void;
  editLng: number;
  setEditLng: (v: number) => void;
  editImageFile: File | null;
  setEditImageFile: (f: File | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
};

export default function EditPropertyModal({
  editModalData,
  setEditModalData,
  editPrice,
  setEditPrice,
  editLat,
  setEditLat,
  editLng,
  setEditLng,
  editImageFile,
  setEditImageFile,
  loading,
  setLoading,
  error,
  setError,
  setSuccess,
}: EditPropertyModalProps) {
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
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!editPrice || Number(editPrice) <= 0) {
      showErrorToast("Please enter a valid price.");
      return;
    }
    if (editLat === 0 || editLng === 0) {
      showErrorToast("Please enter a valid latitude and longitude.");
      return;
    }
    setLoading(true);
    if (!editModalData) {
      showErrorToast("No property selected for editing.");
      setLoading(false);
      return;
    }
    let imagePath = editModalData.image;
    if (editImageFile) {
      const userId = await getUserId();
      const fileExt = editImageFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, editImageFile);
      if (uploadError) {
        setError("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }
      if (editModalData.image && editModalData.image !== fileName) {
        await supabase.storage.from("images").remove([editModalData.image]);
      }
      imagePath = fileName;
    }
    const { error: updateError } = await supabase
      .from("users")
      .update({
        price: editPrice,
        image: imagePath,
        lat: editLat,
        lng: editLng,
      })
      .eq("id", editModalData.id);
    if (updateError) setError(updateError.message);
    else setEditModalData(null);
    setLoading(false);
    setSuccess("Property updated!");
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
          onClick={() => setEditModalData(null)}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Property</h2>
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
              value={editPrice}
              onKeyDown={(e) =>
                (e.key === "-" ||
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === ".") &&
                e.preventDefault()
              }
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) setEditPrice(val);
                else if (val === "") setEditPrice("");
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            Image
            <div className="relative">
              <input
                id="edit-image-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  document.getElementById("edit-image-input")?.click()
                }
              >
                Choose File
              </Button>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {editModalData?.image
                ? `Selected: ${editModalData.image}`
                : "No file chosen"}
            </span>
          </label>
          <div className="flex flex-col gap-1">
            <div>Latitude: {editLat}</div>
            <div>Longitude: {editLng}</div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}

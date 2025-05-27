"use client";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef as useReactRef } from "react";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: 40.759,
  lng: -73.9845,
};

export default function Home() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [showModal, setShowModal] = useState(false);
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalData, setModalData] = useState<{
    image: string;
    price: string;
  } | null>(null);
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [ignoreNextMapClick, setIgnoreNextMapClick] = useState(false);
  const [editModalData, setEditModalData] = useState<any>(null);
  const [deleteModalData, setDeleteModalData] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editLat, setEditLat] = useState(0);
  const [editLng, setEditLng] = useState(0);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const toastRef = useReactRef<HTMLDivElement>(null);

  // Fetch properties from Supabase users table
  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase.from("users").select();
      if (error) return;
      // For each property, get signed image URL
      const propertiesWithSignedUrls = await Promise.all(
        (data || []).map(async (property: any) => {
          let imageUrl = "";
          if (property.image) {
            const { data: signedUrlData } = await supabase.storage
              .from("images")
              .createSignedUrl(property.image, 60 * 60 * 24 * 7); // 7 days
            imageUrl = signedUrlData?.signedUrl || "";
          }
          return {
            ...property,
            imageUrl,
          };
        })
      );
      setProperties(propertiesWithSignedUrls);
    }
    fetchProperties();
  }, [success]); // refetch on success (after add)

  // When opening edit modal, prefill fields
  useEffect(() => {
    if (editModalData) {
      setEditPrice(editModalData.price);
      setEditLat(editModalData.lat);
      setEditLng(editModalData.lng);
      setEditImageFile(null);
    }
  }, [editModalData]);

  // Toast effect
  useEffect(() => {
    if (success) {
      if (toastRef.current) {
        toastRef.current.style.opacity = "1";
      }
      const timeout = setTimeout(() => {
        if (toastRef.current) {
          toastRef.current.style.opacity = "0";
        }
        setTimeout(() => setSuccess(""), 500);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [success]);

  useEffect(() => {
    async function checkAuth() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.location.href = "/login";
      }
    }
    checkAuth();
  }, []);

  if (!isLoaded) return <div>Loading...</div>;

  // Get current user id from Supabase
  async function getUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  }

  // Handle form submit
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
    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName; // or `images/${fileName}` if you want the full path
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile);
    if (uploadError) {
      setError("Image upload failed: " + uploadError.message);
      setLoading(false);
      return;
    }
    // Insert property into users table
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
    }
    setLoading(false);
  }

  function formatPrice(value: string) {
    if (!value) return "";
    return Number(value).toLocaleString();
  }

  return (
    <div className="relative w-full h-screen">
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
      {/* Add Button */}
      <Button
        className="absolute top-6 right-6 z-10"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
      >
        Log Out
      </Button>
      {/* Modal */}
      {showModal && (
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
                <div>
                  Latitude: {clickedPosition?.lat ?? "Click map to select"}
                </div>
                <div>
                  Longitude: {clickedPosition?.lng ?? "Click map to select"}
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Submit"}
              </Button>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm">{success}</div>
              )}
            </form>
          </div>
        </div>
      )}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center relative min-w-[320px]">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setModalData(null)}
              aria-label="Close"
              type="button"
            >
              ×
            </button>
            <img
              src={modalData.image}
              alt="Property"
              className="w-64 h-40 object-cover rounded"
            />
            <div className="mt-2 text-xl font-bold">
              $ {formatPrice(modalData.price)}
            </div>
            <div className="w-full flex flex-row gap-4 mt-4">
              <Button
                className="w-[calc(50%-8px)] bg-green-700 hover:bg-green-800 text-white"
                onClick={() => {
                  setModalData(null);
                  setEditModalData({
                    ...properties.find(
                      (p) =>
                        p.imageUrl === modalData?.image &&
                        p.price === modalData?.price
                    ),
                  });
                }}
              >
                Edit
              </Button>
              <Button
                className="w-[calc(50%-8px)] bg-red-700 hover:bg-red-800 text-white"
                onClick={() => {
                  setModalData(null);
                  setDeleteModalData({
                    ...properties.find(
                      (p) =>
                        p.imageUrl === modalData?.image &&
                        p.price === modalData?.price
                    ),
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      {editModalData && (
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError("");
                let imagePath = editModalData.image;
                // If a new image is selected, upload it
                if (editImageFile) {
                  const userId = await getUserId();
                  const fileExt = editImageFile.name.split(".").pop();
                  const fileName = `${userId}-${Date.now()}.${fileExt}`;
                  const { data: uploadData, error: uploadError } =
                    await supabase.storage
                      .from("images")
                      .upload(fileName, editImageFile);
                  if (uploadError) {
                    setError("Image upload failed: " + uploadError.message);
                    setLoading(false);
                    return;
                  }
                  // Delete previous image if it exists and is different
                  if (editModalData.image && editModalData.image !== fileName) {
                    await supabase.storage
                      .from("images")
                      .remove([editModalData.image]);
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
              }}
              className="flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1">
                Price
                <Input
                  type="number"
                  min={1}
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
                    if (/^\d*$/.test(val) && Number(val) > 0) setEditPrice(val);
                    else if (val === "") setEditPrice("");
                  }}
                  required
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
                    onChange={(e) =>
                      setEditImageFile(e.target.files?.[0] || null)
                    }
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
                    ? `Current file: ${editModalData.image}`
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
              {error && <div className="text-red-600 text-sm">{error}</div>}
            </form>
          </div>
        </div>
      )}
      {deleteModalData && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setDeleteModalData(null)}
              aria-label="Close"
              type="button"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">
              Are you sure you want to delete this property?
            </h2>
            <div className="flex gap-4 mt-4">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  setLoading(true);
                  await supabase
                    .from("users")
                    .delete()
                    .eq("id", deleteModalData.id);
                  setDeleteModalData(null);
                  setLoading(false);
                  setSuccess("Property deleted!");
                }}
              >
                Yes
              </Button>
              <Button onClick={() => setDeleteModalData(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div
          ref={toastRef}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-500"
          style={{ opacity: 1 }}
        >
          {success}
        </div>
      )}
    </div>
  );
}

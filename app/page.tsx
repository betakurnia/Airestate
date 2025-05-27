"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, getGoogleMapsApiKey } from "@/lib/utils";
import MapView from "@/components/MapView";
import AddPropertyModal from "@/components/AddPropertyModal";
import EditPropertyModal from "@/components/EditPropertyModal";
import DeletePropertyModal from "@/components/DeletePropertyModal";
import MarkerModal from "@/components/MarkerModal";
import Toast from "@/components/Toast";
import { Button } from "@/components/ui/button";

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
type ModalData = { image: string; price: string } | null;

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalData, setModalData] = useState<ModalData>(null);
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [ignoreNextMapClick, setIgnoreNextMapClick] = useState(false);
  const [editModalData, setEditModalData] = useState<Property | null>(null);
  const [deleteModalData, setDeleteModalData] = useState<Property | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editLat, setEditLat] = useState(0);
  const [editLng, setEditLng] = useState(0);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase.from("users").select();
      if (error) return;
      const propertiesWithSignedUrls = await Promise.all(
        (data || []).map(async (property) => {
          let imageUrl = "";
          if (property.image) {
            const { data: signedUrlData } = await supabase.storage
              .from("images")
              .createSignedUrl(property.image, 60 * 60 * 24 * 7);
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
  }, [success]);

  useEffect(() => {
    if (editModalData) {
      setEditPrice(editModalData.price);
      setEditLat(editModalData.lat);
      setEditLng(editModalData.lng);
      setEditImageFile(null);
    }
  }, [editModalData]);

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

  if (!getGoogleMapsApiKey()) return <div>Loading...</div>;

  return (
    <div className="relative w-full h-screen">
      <MapView
        properties={properties}
        setModalData={setModalData}
        setClickedPosition={setClickedPosition}
        setShowModal={setShowModal}
        ignoreNextMapClick={ignoreNextMapClick}
        setIgnoreNextMapClick={setIgnoreNextMapClick}
      />
      <Button
        className="absolute top-6 right-6 z-10"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
      >
        Log Out
      </Button>
      {showModal && (
        <AddPropertyModal
          setShowModal={setShowModal}
          price={price}
          setPrice={setPrice}
          imageFile={imageFile}
          setImageFile={setImageFile}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          success={success}
          setSuccess={setSuccess}
          clickedPosition={clickedPosition}
          setClickedPosition={setClickedPosition}
        />
      )}
      {modalData && (
        <MarkerModal
          modalData={modalData}
          setModalData={setModalData}
          properties={properties}
          setEditModalData={setEditModalData}
          setDeleteModalData={setDeleteModalData}
        />
      )}
      {editModalData && (
        <EditPropertyModal
          editModalData={editModalData}
          setEditModalData={setEditModalData}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editLat={editLat}
          setEditLat={setEditLat}
          editLng={editLng}
          setEditLng={setEditLng}
          editImageFile={editImageFile}
          setEditImageFile={setEditImageFile}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}
      {deleteModalData && (
        <DeletePropertyModal
          deleteModalData={deleteModalData}
          setDeleteModalData={setDeleteModalData}
          setLoading={setLoading}
          setSuccess={setSuccess}
        />
      )}
      {success && <Toast toastRef={toastRef} success={success} />}
    </div>
  );
}

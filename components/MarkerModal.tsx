import { Button } from "@/components/ui/button";

export default function MarkerModal({
  modalData,
  setModalData,
  properties,
  setEditModalData,
  setDeleteModalData,
}: any) {
  function formatPrice(value: string) {
    if (!value) return "";
    return Number(value).toLocaleString();
  }
  return (
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
          src={modalData.imageUrl}
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
              setEditModalData(modalData);
            }}
          >
            Edit
          </Button>
          <Button
            className="w-[calc(50%-8px)] bg-red-700 hover:bg-red-800 text-white"
            onClick={() => {
              setModalData(null);
              setDeleteModalData(modalData);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

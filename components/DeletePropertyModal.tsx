import { getSupabaseClient } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function DeletePropertyModal({
  deleteModalData,
  setDeleteModalData,
  setLoading,
  setSuccess,
}: any) {
  return (
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
              await getSupabaseClient()
                .from("users")
                .delete()
                .eq("id", deleteModalData.id);
              setLoading(false);
              setSuccess("Property deleted!");
              setDeleteModalData(null);
            }}
          >
            Yes
          </Button>
          <Button onClick={() => setDeleteModalData(null)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

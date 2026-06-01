import { getBucketListItems } from "../actions";
import { BucketListClient } from "@/components/ui/BucketListClient";

export const dynamic = "force-dynamic";

export default async function BucketListPage() {
  const items = await getBucketListItems();

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Summer Bucket List ☀️</h1>
        <p className="text-lg text-gray-500 mt-2">Check off these fun family activities as we complete them!</p>
      </div>

      <BucketListClient initialItems={items as any[]} />
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingVehicleLookup() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

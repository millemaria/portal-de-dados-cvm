import { SkeletonCard, SkeletonTable } from "@/components/shared/LoadingSpinner";

export default function CompanyLoading() {
  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <SkeletonCard />
      <div className="grid grid-cols-2 min-[540px]:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card p-3 sm:p-4">
            <div className="skeleton h-4 w-8 mb-2" />
            <div className="skeleton h-3 w-20 mb-1" />
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <SkeletonTable />
        <SkeletonTable />
      </div>
    </div>
  );
}

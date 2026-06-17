// Shown automatically by Next.js while ANY /admin/* segment is server-
// rendering. Instead of staring at the previous page (or a blank canvas)
// during the data fetch, the user sees a skeleton in the destination page's
// shape — instant feedback that the navigation landed and content is on
// the way. Lives under /admin so all admin sub-routes inherit it.
//
// Combined with the SidebarNavItem useLinkStatus active flip, the result is:
//   1. User taps sidebar item -> active state flips instantly
//   2. This skeleton fills the main column instantly
//   3. Real content streams in as soon as the server returns

export default function AdminLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Page heading skeleton */}
            <div className="space-y-2">
                <div className="h-3 w-24 bg-surface rounded" />
                <div className="h-8 w-72 bg-surface rounded" />
                <div className="h-3 w-56 bg-surface rounded" />
            </div>

            {/* Toolbar / filter strip skeleton */}
            <div className="bg-white border border-border rounded-[12px] p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="h-9 w-64 bg-surface rounded" />
                    <div className="h-9 w-32 bg-surface rounded" />
                    <div className="h-9 w-32 bg-surface rounded" />
                    <div className="h-9 w-24 bg-surface rounded" />
                </div>
            </div>

            {/* Content card skeleton */}
            <div className="bg-white border border-border rounded-[12px] overflow-hidden">
                <div className="border-b border-border p-4">
                    <div className="grid grid-cols-5 gap-4">
                        <div className="h-3 bg-surface rounded col-span-1" />
                        <div className="h-3 bg-surface rounded col-span-1" />
                        <div className="h-3 bg-surface rounded col-span-1" />
                        <div className="h-3 bg-surface rounded col-span-1" />
                        <div className="h-3 bg-surface rounded col-span-1" />
                    </div>
                </div>
                {[0, 1, 2, 3, 4].map(row => (
                    <div key={row} className="border-b border-border/50 p-5">
                        <div className="grid grid-cols-5 gap-4 items-center">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-surface rounded" />
                                <div className="h-2 w-14 bg-surface rounded" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-32 bg-surface rounded" />
                                <div className="h-2 w-24 bg-surface rounded" />
                            </div>
                            <div className="h-6 w-32 bg-surface rounded" />
                            <div className="h-6 w-24 bg-surface rounded" />
                            <div className="h-9 w-28 bg-surface rounded ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DashboardLoading() {
    return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-pulse space-y-4 w-full max-w-md">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
            </div>
        </div>
    );
}

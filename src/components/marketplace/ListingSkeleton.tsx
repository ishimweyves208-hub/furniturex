export function ListingSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="container py-8 sm:py-10" aria-busy="true" aria-label="Loading furniture">
      <div className="space-y-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-9 w-64 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
        <div className="skeleton hidden h-[430px] rounded-xl lg:block" />
        <div>
          <div className="skeleton h-10 w-full rounded-xl lg:hidden" />
          <div className="mt-4 grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: cards }).map((_, index) => (
              <div key={index}>
                <div className="skeleton aspect-[4/5] rounded-2xl" />
                <div className="mt-3.5 space-y-2">
                  <div className="skeleton h-2.5 w-16" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

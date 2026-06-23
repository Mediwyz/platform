export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001E40]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#9AE1FF]/30 border-t-[#9AE1FF] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-white/50">Loading…</p>
      </div>
    </div>
  )
}

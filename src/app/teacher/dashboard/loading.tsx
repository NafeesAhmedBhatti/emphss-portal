export default function TeacherLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-14 rounded-2xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-3xl bg-slate-200" />
          <div className="h-80 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

import Header from "@/components/Header";

export default function OfficersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Officers</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Meet our leadership team
          </p>
          <div className="bg-gray-100 rounded-lg p-4 sm:p-6 lg:p-8">
            <p className="text-gray-500 text-sm sm:text-base">Officers page content coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

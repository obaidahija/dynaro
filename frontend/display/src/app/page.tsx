export default function DisplayPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-2xl">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dynrow Display Screen
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            This screen will show your live menu and promotions
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              To connect this display:
            </h2>
            
            <ol className="text-left space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                Go to your Dashboard and set up your store
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
                Add menu items and create promotions
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
                Navigate to: <code className="bg-white px-2 py-1 rounded text-sm">http://localhost:3001/[store-id]</code>
              </li>
            </ol>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Dashboard URL: <strong>http://localhost:3000</strong></p>
            <p>This Display URL: <strong>http://localhost:3001</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
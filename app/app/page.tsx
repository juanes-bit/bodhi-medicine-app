export default function AppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Bodhi-Medicine-Logo-2020-_-all-in-one-01.jpg-IlMrok6fRIpMZGsyYD2VrOXatACFJK.jpeg"
            alt="Bodhi Medicine Logo"
            className="w-64 h-auto mx-auto mb-6"
          />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bodhi Medicine App</h1>

        <p className="text-xl text-gray-600 mb-8">Your Body Knows - React Native Learning Platform</p>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Mobile App Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">Learning Platform</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Course catalog with search & filters</li>
                <li>• Video lessons with progress tracking</li>
                <li>• HTML content rendering</li>
                <li>• Offline content support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">User Experience</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• JWT authentication</li>
                <li>• Subscription management</li>
                <li>• Progress synchronization</li>
                <li>• Push notifications</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            This is a React Native/Expo application. To run the mobile app, use the Expo CLI with the project files.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150"></div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-2">UNI MOBILITY</h2>
          <p className="text-gray-400">Cargando aplicación...</p>
        </div>
      </div>
    </div>
  );
}
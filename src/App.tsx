'use client';

import RegistrationForm from './components/RegistrationForm';

function App() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center relative overflow-hidden bg-gradient-to-br from-green-50 to-yellow-50">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sdg-green rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-64 h-64 bg-sdg-yellow rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-sdg-orange rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Responsive Header for Logos */}
      <div className="w-full flex justify-between items-center p-4 z-50 md:absolute md:top-0 md:left-0 md:p-6">
          {/* SDG Logo (Left) */}
          <div className="flex-shrink-0">
             <img src="/sdg-transparent.png" alt="SDG Logo" className="h-12 w-auto md:h-20" />
          </div>

          {/* College Logo (Right) */}
          <div className="flex-shrink-0">
             <img src="/logo.png" alt="Logo" className="h-12 w-auto md:h-20" />
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex items-center justify-center p-4 z-10">
        <RegistrationForm />
      </div>

    </main>
  );
}

export default App;

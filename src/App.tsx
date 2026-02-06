'use client';

import RegistrationForm from './components/RegistrationForm';

function App() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-yellow-50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
            <div className="absolute top-10 left-10 w-64 h-64 bg-sdg-green rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-sdg-yellow rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-64 h-64 bg-sdg-orange rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Logo */}
        <div className="absolute top-6 right-6 z-50">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto md:h-16" />
        </div>

        {/* SDG Logo */}
        <div className="absolute top-6 left-6 z-50">
            <img src="/sdg-transparent.png" alt="SDG Logo" className="h-12 w-auto md:h-16" />
        </div>

      <div className="z-10 w-full flex justify-center">
        <RegistrationForm />
      </div>
    </main>
  );
}

export default App;

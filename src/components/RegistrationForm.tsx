'use client';

import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function RegistrationForm() {
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useGSAP(() => {
    gsap.from(formRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    gsap.from('.form-item', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      delay: 0.3,
      ease: 'power2.out',
    });
  }, { scope: containerRef });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // MOCK SUBMISSION (No Backend)
    setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        if (formRef.current) {
            gsap.to(formRef.current, {
                scale: 0.95,
                opacity: 0, 
                duration: 0.5,
            });
        }
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <h2 className="text-4xl font-bold text-sdg-green mb-4">Registration Successful!</h2>
        <p className="text-xl text-gray-700">Thank you for joining the SDG initiative.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 bg-sdg-yellow text-white rounded-full hover:bg-sdg-orange transition-colors"
        >
          Register Another
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-sdg-green via-sdg-yellow to-sdg-orange p-1 h-2"></div>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Join the Movement</h1>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              name="name" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">College / Organization</label>
            <input 
              name="college" 
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all"
              placeholder="University of Life"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              name="email" 
              type="email"
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input 
              name="mobile" 
              required 
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all"
              placeholder="+1234567890"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-300">
                <span>Choose File</span>
                <input 
                  name="photo" 
                  type="file" 
                  accept="image/*" 
                  required 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
              {preview && (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sdg-yellow">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="form-item pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-sdg-green text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? 'Submitting...' : 'Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

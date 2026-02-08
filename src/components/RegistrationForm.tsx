'use client';

import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;
const SECRET_TOKEN = 'SDG_SECURE_TOKEN_2025';

export default function RegistrationForm() {
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileData, setFileData] = useState<{ base64: string, name: string, type: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { width, height } = useWindowSize();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    email: '',
    mobile: ''
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // derived state for validation
  useEffect(() => {
    const isValid = 
      formData.name.trim() !== '' &&
      formData.college.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.mobile.trim() !== '' &&
      fileData !== null;
    
    setIsFormValid(isValid);
  }, [formData, fileData]);


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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFileData({
          base64: result,
          name: file.name,
          type: file.type
        });

        if (file.type.startsWith('image/')) {
          setPreview(result);
        } else {
          setPreview(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!fileData) {
      alert("Please upload your photo before registering.");
      setLoading(false);
      return;
    }

    const payload = {
      token: SECRET_TOKEN,
      name: formData.name,
      college: formData.college,
      email: formData.email,
      mobile: formData.mobile,
      file: fileData?.base64 || '',
      fileName: fileData?.name || '',
      mimeType: fileData?.type || ''
    };

    console.log("Preparing to submit payload:", {
      ...payload,
      file: payload.file ? `Base64 String (${payload.file.length} chars)` : 'EMPTY'
    });

    try {
      console.log("Sending request to:", APP_SCRIPT_URL);

      const response = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      console.log("Response received (opaque if no-cors):", response);

      setSuccess(true);
      if (formRef.current) {
        gsap.to(formRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.5,
        });
      }
    } catch (error) {
      console.error("Submission Error Details:", error);
      alert("Failed to submit. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in relative">
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={500}
          gravity={0.15}
        />
        <h2 className="text-4xl font-bold text-sdg-green mb-4 z-10">Registration Successful!</h2>
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
    <div ref={containerRef} className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 hover:shadow-sdg-green/20 transition-all duration-500">
      <div className="bg-gradient-to-r from-sdg-green via-sdg-yellow to-sdg-orange p-1 h-2 animate-pulse"></div>
      <div className="p-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sdg-green to-sdg-orange mb-8 text-center drop-shadow-sm">Join the Movement</h1>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="form-item group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-transparent bg-gray-50 rounded-xl focus:bg-white focus:border-sdg-green focus:ring-4 focus:ring-sdg-green/20 outline-none transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white hover:shadow-lg text-black placeholder-gray-400"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-item group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">College / Organization</label>
            <input
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-transparent bg-gray-50 rounded-xl focus:bg-white focus:border-sdg-green focus:ring-4 focus:ring-sdg-green/20 outline-none transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white hover:shadow-lg text-black placeholder-gray-400"
              placeholder="Enter your college/organization name"
            />
          </div>

          <div className="form-item group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">Email Address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-transparent bg-gray-50 rounded-xl focus:bg-white focus:border-sdg-green focus:ring-4 focus:ring-sdg-green/20 outline-none transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white hover:shadow-lg text-black placeholder-gray-400"
              placeholder="xyz@gmail.com"
            />
          </div>

          <div className="form-item group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">Mobile Number</label>
            <input
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-2 border-transparent bg-gray-50 rounded-xl focus:bg-white focus:border-sdg-green focus:ring-4 focus:ring-sdg-green/20 outline-none transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white hover:shadow-lg text-black placeholder-gray-400"
              placeholder="+918787878787"
            />
          </div>

          <div className="form-item group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">Upload Your Photo</label>
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 group-hover:border-sdg-green transition-colors duration-300 bg-gray-50 hover:bg-green-50/30 p-4">
              <div className="flex items-center space-x-4 relative z-10">
                <label className="cursor-pointer bg-white text-gray-700 px-6 py-2 rounded-lg shadow-md hover:shadow-lg hover:text-sdg-green hover:scale-105 transition-all duration-300 uppercase tracking-wider font-bold text-xs ring-1 ring-gray-100">
                  <span>{fileData ? 'Change File' : 'Choose File'}</span>
                  <input
                    name="photo"
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {preview ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-sdg-yellow animate-blob">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : fileData && (
                  <div className="text-sm font-medium text-gray-600 truncate max-w-[180px] bg-white px-3 py-1 rounded-full shadow-sm">
                    {fileData.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-item pt-6">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full font-extrabold py-4 rounded-xl shadow-xl transform transition-all duration-300 uppercase tracking-widest text-sm
                ${loading || !isFormValid 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed grayscale' 
                  : 'bg-gradient-to-r from-sdg-green via-sdg-yellow to-sdg-orange text-white hover:shadow-2xl hover:shadow-sdg-green/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 bg-[length:200%_auto] animate-gradient-x'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Request to Join'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const APP_SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;
const SECRET_TOKEN = 'SDG_SECURE_TOKEN_2025';

export default function RegistrationForm() {
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileData, setFileData] = useState<{ base64: string, name: string, type: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-black-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all placeholder-gray-400 text-black"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">College / Organization</label>
            <input
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all placeholder-gray-400 text-black"
              placeholder="Enter your college/organization name"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all placeholder-gray-400 text-black"
              placeholder="xyz@gmail.com"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sdg-green focus:border-transparent outline-none transition-all placeholder-gray-400 text-black"
              placeholder="+918787878787"
            />
          </div>

          <div className="form-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Your Photo</label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-400">
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
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-sdg-yellow">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : fileData && (
                <div className="text-sm text-gray-600 truncate max-w-[200px]">
                  {fileData.name}
                </div>
              )}
            </div>
          </div>

          <div className="form-item pt-4">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full font-bold py-3 rounded-xl shadow-lg transform transition-all 
                ${loading || !isFormValid 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-sdg-green text-white hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing... Do not Refresh</span>
                </div>
              ) : (
                'Register Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraMode(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraMode(false);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg');
        setFileData({
          base64: base64,
          name: `captured-photo-${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
        setPreview(base64);
        stopCamera();
      }
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

  // Confetti opacity state
  const [confettiOpacity, setConfettiOpacity] = useState(1);

  useEffect(() => {
    if (success) {
      // Start fading out after 6 seconds
      const timer = setTimeout(() => {
        setConfettiOpacity(0);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (success) {
    return (
      <>
        <div 
          className="fixed inset-0 z-[100] pointer-events-none transition-opacity duration-1000 ease-out"
          style={{ opacity: confettiOpacity }}
        >
          <Confetti
            width={width}
            height={height}
            recycle={true}
            numberOfPieces={500}
            gravity={0.15}
          />
        </div>
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in relative z-10">
          <h2 className="text-4xl font-bold text-sdg-green mb-4">Registration Successful!</h2>
          <p className="text-xl text-gray-700">Thank you for joining the SDG initiative.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-sdg-yellow text-white rounded-full hover:bg-sdg-orange transition-colors"
          >
            Register Another
          </button>
        </div>
      </>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-sdg-green transition-colors">Your Photo</label>
            
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 group-hover:border-sdg-green transition-all duration-300 bg-gray-50/50 p-4">
              {isCameraMode ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20"></div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="flex-1 bg-sdg-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-200"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-6 bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {preview ? (
                    <div className="flex items-center space-x-6 p-2">
                      <div className="relative group/preview">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl ring-2 ring-sdg-yellow transition-transform duration-500 group-hover/preview:scale-110">
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-sdg-green text-white rounded-full flex items-center justify-center text-xs shadow-lg">✓</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => { setPreview(null); setFileData(null); }}
                          className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider block"
                        >
                          Remove Photo
                        </button>
                        <p className="text-sm font-medium text-gray-500 truncate max-w-[150px]">
                          {fileData?.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="cursor-pointer bg-white border-2 border-gray-100 text-gray-700 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-sdg-green hover:text-sdg-green transition-all duration-300 text-center group/btn">
                          <div className="text-2xl mb-1 group-hover/btn:scale-125 transition-transform">📁</div>
                          <span className="block text-[10px] font-black uppercase tracking-widest">Upload File</span>
                          <input
                            name="photo"
                            type="file"
                            accept="image/jpeg, image/png, image/jpg"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={startCamera}
                          className="bg-white border-2 border-gray-100 text-gray-700 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-sdg-orange hover:text-sdg-orange transition-all duration-300 text-center group/btn"
                        >
                          <div className="text-2xl mb-1 group-hover/btn:scale-125 transition-transform">📸</div>
                          <span className="block text-[10px] font-black uppercase tracking-widest">Take Photo</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-tighter italic">Recommended: Clear face photo for ID card</p>
                    </div>
                  )}
                </div>
              )}
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

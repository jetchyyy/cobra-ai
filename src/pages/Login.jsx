import { useState } from 'react';
import { Sparkles, MessageSquare, BookOpen, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (isRegister && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (isRegister && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(formData.email, formData.password, formData.name);
      } else {
        await signInWithEmail(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-black flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-red-900/30 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-full overflow-hidden">
              <img 
                src="/cobralog.png" 
                alt="Cobra Logo" 
                className="w-40 h-40 object-cover"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Cobra</h1>
          <p className="text-red-300 text-lg">AI Study Assistant</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center text-white/90">
            <BookOpen className="w-5 h-5 mr-3 text-red-400" />
            <span>Summarize your study modules</span>
          </div>
        <div className="flex items-center text-white/90">
  <Sparkles className="w-5 h-5 mr-3 text-red-400" />
  <span>Get instant AI assistance</span>
</div>
          <div className="flex items-center text-white/90">
            <MessageSquare className="w-5 h-5 mr-3 text-red-400" />
            <span>Save and review your chat history</span>
          </div>
        </div>

    <form onSubmit={handleSubmit} className="space-y-4 mb-4">
  {isRegister && (
    <div>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-white/10 border border-red-900/30 rounded-lg py-3 pl-10 pr-4 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      {errors.name && (
        <p className="text-red-300 text-sm mt-1">{errors.name}</p>
      )}
    </div>
  )}

  {/* Email */}
  <div>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full bg-white/10 border border-red-900/30 rounded-lg py-3 pl-10 pr-4 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
    {errors.email && (
      <p className="text-red-300 text-sm mt-1">{errors.email}</p>
    )}
  </div>

  {/* Password */}
  <div>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
      <input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="w-full bg-white/10 border border-red-900/30 rounded-lg py-3 pl-10 pr-10 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-200"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
    {errors.password && (
      <p className="text-red-300 text-sm mt-1">{errors.password}</p>
    )}
  </div>

  {isRegister && (
    <div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
        <input
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full bg-white/10 border border-red-900/30 rounded-lg py-3 pl-10 pr-4 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      {errors.confirmPassword && (
        <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>
      )}
    </div>
  )}

  <button
    type="submit"
    disabled={loading}
    className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg"
  >
    {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
  </button>
</form>


        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-red-900/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-red-200">Or continue with</span>
          </div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center shadow-lg"
        >
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div className="text-center mt-6">
          <button
            onClick={toggleMode}
            className="text-red-200 hover:text-white text-sm transition duration-200"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="text-center text-red-200 text-sm mt-4">
          {isRegister ? 'Create an account to save your chat history' : 'Sign in to access your saved chats'}
        </p>
      </div>
    </div>
  );
};

export default Login;
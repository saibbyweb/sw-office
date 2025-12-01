import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUser } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

interface LoginProps {
  onLogin: (role: 'admin' | 'hr') => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'hr'>('admin');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === 'abc') {
      toast.success(`Welcome ${selectedRole.toUpperCase()}!`);
      onLogin(selectedRole);

      // Navigate to appropriate dashboard
      if (selectedRole === 'hr') {
        navigate('/hr');
      } else {
        navigate('/');
      }
    } else {
      toast.error('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text mb-2">
              SW Office
            </h1>
            <p className="text-gray-600">Login to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                      : 'bg-white/60 text-gray-700 hover:bg-white border border-gray-200'
                  }`}
                >
                  <FiUser className="w-4 h-4" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('hr')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedRole === 'hr'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white/60 text-gray-700 hover:bg-white border border-gray-200'
                  }`}
                >
                  <FiUser className="w-4 h-4" />
                  HR
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
                  : 'bg-gradient-to-r from-rose-600 to-pink-600'
              }`}
            >
              Login as {selectedRole.toUpperCase()}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Development credentials: password = "abc"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

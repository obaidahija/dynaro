'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard once auth state confirms user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Dynaro" className="h-16 w-auto object-contain mx-auto mb-4" />
          <p className="text-gray-500 mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

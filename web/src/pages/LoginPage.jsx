import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  // CRITICAL FIX: useAuth is called at the component's top level, NOT inside a handler
  const { login, requestPasswordReset } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Using the requestPasswordReset function from the closure
      await requestPasswordReset(resetEmail);
      toast.success('Password reset email sent');
      setShowResetForm(false);
      setResetEmail('');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - SGRD</title>
        <meta name="description" content="Login to your SGRD account to manage orders and profile." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-none">
          <CardHeader className="text-center">
            <Link to="/" className="inline-flex items-center justify-center space-x-3 mb-6">
              <img 
                src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/fd86f6287aeec79dae55a25e55821f3f.png" 
                alt="SGRD Logo" 
                className="w-12 h-12 object-contain"
              />
            </Link>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Login to your account to continue shopping</CardDescription>
          </CardHeader>
          <CardContent>
            {!showResetForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-4">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setShowResetForm(false)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
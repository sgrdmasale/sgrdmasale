import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[SignupPage] Form submitted for email:', formData.email);

    if (formData.password !== formData.passwordConfirm) {
      console.warn('[SignupPage] Validation failed: Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      console.warn('[SignupPage] Validation failed: Password too short');
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('[SignupPage] Calling signup context method...');
      await signup(formData.name, formData.email, formData.password, formData.passwordConfirm);
      console.log('[SignupPage] Signup successful, redirecting to home...');
      toast.success('Account created successfully');
      navigate('/');
    } catch (error) {
      console.error('[SignupPage] Signup error caught in UI:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - SGRD</title>
        <meta name="description" content="Create your SGRD account to start shopping premium Indian spices." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#F7B801] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold">SGRD</span>
            </Link>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Sign up to start shopping premium spices</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>

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
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirm Password</Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SignupPage;
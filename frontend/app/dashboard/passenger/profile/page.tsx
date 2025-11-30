'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import PassengerNavbar from '@/app/components/PassengerNavbar';

type ProfileFormData = Pick<PassengerProfile, 'first_name' | 'last_name' | 'phone_number' | 'gender'>;


interface PassengerProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: string;
  gender: string;
  profile_picture: string | null;
}

export default function PassengerProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [passenger, setPassenger] = useState<PassengerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    gender: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');

        if (!token) throw new Error('No access token found');

        const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('Profile fetch error:', text);
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        setPassenger(data);
        setFormData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.statusText} - ${errorText}`);
      }

      const updatedData = await response.json();
      setPassenger(updatedData);
      updateUser(updatedData.user);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !passenger) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error: </strong> {error}
          <button
            onClick={() => window.location.reload()}
            className="ml-4 text-blue-600 underline text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!passenger) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">No profile data found.</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
    <PassengerNavbar 
      user={{
    first_name: user?.first_name,
    last_name: user?.last_name,
    email: user?.email
  }} 
      onLogout={logout} 
/>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <Card className="p-8 shadow-lg rounded-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="w-28 h-28">
                <AvatarImage src={passenger.profile_picture || '/default-profile.png'} />
                <AvatarFallback>
                  {passenger.first_name?.[0]}
                  {passenger.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700"
                >
                  ✎
                </button>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">
              {passenger.first_name} {passenger.last_name}
            </h1>
            <p className="text-gray-500">{passenger.email}</p>
            <p className="text-sm text-gray-400">{passenger.user_type.toUpperCase()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['first_name', 'last_name', 'phone_number', 'gender'].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="text-gray-600 capitalize">
                      {field.replace('_', ' ')}
                    </Label>
                    <Input
                      id={field}
                      name={field}
                      value={formData[field as keyof ProfileFormData] || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

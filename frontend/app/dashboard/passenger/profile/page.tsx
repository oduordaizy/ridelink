'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/contexts/AuthContext';
import Footer from '@/app/components/Footer';
import { API_BASE_URL } from '@/app/services/api';
import { FaCamera, FaUser, FaPhone, FaVenusMars } from 'react-icons/fa';



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
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');

        if (!token) throw new Error('No access token found');

        const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
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
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_number: data.phone_number || '',
          gender: data.gender || ''
        });
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

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePicture(e.target.files[0]);
    }
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) payload.append(key, value as string);
      });

      if (newProfilePicture) {
        payload.append('profile_picture', newProfilePicture);
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.statusText} - ${errorText}`);
      }

      const updatedData = await response.json();
      setPassenger(updatedData);
      updateUser(updatedData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setNewProfilePicture(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !passenger) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Card className="p-8 shadow-xl rounded-3xl border-none">
          <div className="flex flex-col items-center mb-10">
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                <AvatarImage
                  src={newProfilePicture ? URL.createObjectURL(newProfilePicture) : (passenger.profile_picture || '/default-profile.png')}
                  className="object-cover"
                />
                <AvatarFallback className="bg-green-100 text-green-700 text-3xl font-bold">
                  {passenger.first_name?.[0]}{passenger.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-1 right-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110">
                <FaCamera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
              {passenger.first_name} {passenger.last_name}
            </h1>
            <p className="text-gray-500 font-medium">{passenger.email}</p>
            <div className="mt-2 px-4 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
              {passenger.user_type}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6 flex items-center gap-2">
                <FaUser className="text-green-600" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-bold text-gray-600 uppercase tracking-wide">First Name</Label>
                  <div className="relative">
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="bg-gray-50/50 border-gray-200 h-12 rounded-xl focus:border-green-500 focus:ring-green-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-bold text-gray-600 uppercase tracking-wide">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="bg-gray-50/50 border-gray-200 h-12 rounded-xl focus:border-green-500 focus:ring-green-500 disabled:opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                    <FaPhone size={12} /> Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="+254 700 000000"
                    className="bg-gray-50/50 border-gray-200 h-12 rounded-xl focus:border-green-500 focus:ring-green-500 disabled:opacity-70"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
                    <FaVenusMars size={14} /> Gender
                  </Label>
                  <Input
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="e.g. Male, Female"
                    className="bg-gray-50/50 border-gray-200 h-12 rounded-xl focus:border-green-500 focus:ring-green-500 disabled:opacity-70"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-100 pt-8">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-[#08A6F6] hover:bg-[#00204a] text-white px-10 h-12 rounded-xl font-bold shadow-lg transition-all"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setNewProfilePicture(null);
                    }}
                    disabled={isLoading}
                    className="px-10 h-12 rounded-xl font-bold border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-10 h-12 rounded-xl font-bold shadow-lg shadow-green-200 transition-all"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </span>
                    ) : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_joined: string;
  passenger_profile: {
    emergency_contact: string;
    emergency_contact_relationship: string;
    preferred_payment_method: string;
    preferred_seat: string;
  };
}

export default function ProfilePage() {
  const { user: currentUser, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    emergency_contact: '',
    emergency_contact_relationship: '',
    preferred_payment_method: '',
    preferred_seat: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    } else if (currentUser) {
      fetchProfile();
    }
  }, [currentUser, isLoading, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/auth/me/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          emergency_contact: data.passenger_profile?.emergency_contact || '',
          emergency_contact_relationship: data.passenger_profile?.emergency_contact_relationship || '',
          preferred_payment_method: data.passenger_profile?.preferred_payment_method || 'mpesa',
          preferred_seat: data.passenger_profile?.preferred_seat || 'any',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    
    if (!formData.emergency_contact.trim()) {
      newErrors.emergency_contact = 'Emergency contact is required';
    }
    
    if (!formData.emergency_contact_relationship.trim()) {
      newErrors.emergency_contact_relationship = 'Relationship is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          passenger_profile: {
            emergency_contact: formData.emergency_contact,
            emergency_contact_relationship: formData.emergency_contact_relationship,
            preferred_payment_method: formData.preferred_payment_method,
            preferred_seat: formData.preferred_seat,
          },
        }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setProfile(updatedUser);
        setEditing(false);
      } else {
        const errorData = await response.json();
        // Handle API validation errors
        if (errorData) {
          const apiErrors: Record<string, string> = {};
          Object.entries(errorData).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              apiErrors[key] = value[0];
            } else if (typeof value === 'string') {
              apiErrors[key] = value;
            }
          });
          setErrors(apiErrors);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (isLoading || loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Passenger Profile
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Personal details and preferences
              </p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    // Reset form to original values
                    setFormData({
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      email: profile.email || '',
                      phone_number: profile.phone_number || '',
                      emergency_contact: profile.passenger_profile?.emergency_contact || '',
                      emergency_contact_relationship: profile.passenger_profile?.emergency_contact_relationship || '',
                      preferred_payment_method: profile.passenger_profile?.preferred_payment_method || 'mpesa',
                      preferred_seat: profile.passenger_profile?.preferred_seat || 'any',
                    });
                    setErrors({});
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaTimes className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.first_name ? 'border-red-300' : ''}`}
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.last_name ? 'border-red-300' : ''}`}
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.email ? 'border-red-300' : ''}`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        name="phone_number"
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.phone_number ? 'border-red-300' : ''}`}
                      />
                      {errors.phone_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Emergency Contact</h3>
                    <p className="mt-1 text-sm text-gray-500">Who should we contact in case of an emergency?</p>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
                      Contact Name & Phone
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="emergency_contact"
                        id="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.emergency_contact ? 'border-red-300' : ''}`}
                      />
                      {errors.emergency_contact && (
                        <p className="mt-1 text-sm text-red-600">{errors.emergency_contact}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="emergency_contact_relationship"
                        id="emergency_contact_relationship"
                        value={formData.emergency_contact_relationship}
                        onChange={handleChange}
                        placeholder="e.g., Spouse, Parent, Sibling"
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.emergency_contact_relationship ? 'border-red-300' : ''}`}
                      />
                      {errors.emergency_contact_relationship && (
                        <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_relationship}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Travel Preferences</h3>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-gray-700">
                      Preferred Payment Method
                    </label>
                    <div className="mt-1">
                      <select
                        id="preferred_payment_method"
                        name="preferred_payment_method"
                        value={formData.preferred_payment_method}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="mpesa">M-Pesa</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="preferred_seat" className="block text-sm font-medium text-gray-700">
                      Preferred Seat
                    </label>
                    <div className="mt-1">
                      <select
                        id="preferred_seat"
                        name="preferred_seat"
                        value={formData.preferred_seat}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="any">Any Available</option>
                        <option value="front">Front Seat</option>
                        <option value="middle">Middle Seat</option>
                        <option value="back">Back Seat</option>
                        <option value="window">Window Seat</option>
                        <option value="aisle">Aisle Seat</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.username}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaPhone className="mr-2 text-gray-400" />
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.phone_number || 'Not provided'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.date_joined).toLocaleDateString()}
                  </dd>
                </div>
                
                <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.passenger_profile?.emergency_contact || 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Relationship</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.passenger_profile?.emergency_contact_relationship || 'Not provided'}
                      </dd>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Travel Preferences</h4>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Preferred Payment</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">
                        {profile.passenger_profile?.preferred_payment_method || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Preferred Seat</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">
                        {profile.passenger_profile?.preferred_seat === 'any' 
                          ? 'Any Available' 
                          : profile.passenger_profile?.preferred_seat || 'Not specified'}
                      </dd>
                    </div>
                  </div>
                </div>
              </dl>
            )}
          </div>
          
          {!editing && (
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <p className="text-xs text-gray-500">
                Last updated: {new Date(profile.passenger_profile?.updated_at || profile.date_joined).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
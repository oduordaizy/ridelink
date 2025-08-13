'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { toast } from "react-toastify"
import DriverNavbar from "@/app/components/DriverNavbar"
import Footer from "@/app/components/Footer"
import DriverSidebar from "@/app/components/DriverSidebar"

type DriverProfile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  user_type: string
  created_at: string
  license_number: string
  vehicle_model: string
  vehicle_color: string
  vehicle_plate: string
  rating: number
}

export default function DriverProfilePage() {
  const { user, updateUser } = useAuth()
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<DriverProfile>>({})

  // Initialize form data when driver data is loaded
  useEffect(() => {
    if (driver) {
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        phone_number: driver.phone_number || '',
        license_number: driver.license_number || '',
        vehicle_model: driver.vehicle_model || '',
        vehicle_color: driver.vehicle_color || '',
        vehicle_plate: driver.vehicle_plate || '',
      })
    }
  }, [driver])

  const fetchProfile = async () => {
    try {
      console.log('Starting to fetch profile...')
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        throw new Error('No access token found')
      }
      
      const response = await fetch("http://127.0.0.1:8000/api/auth/profile/", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch driver profile: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Profile data received:', data)
      setDriver(data)
      setError(null)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
    } finally {
      console.log('Finished loading, setting isLoading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        throw new Error('No access token found')
      }
      
      const response = await fetch("http://127.0.0.1:8000/api/auth/profile/", {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update profile: ${response.status} ${response.statusText}: ${errorText}`)
      }
      
      const updatedData = await response.json()
      setDriver(updatedData)
      
      // Update the auth context with the new user data
      if (updatedData.user) {
        updateUser(updatedData.user)
      }
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-center">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={fetchProfile}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-center text-red-500">No profile data found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div 
            className="h-32 bg-gradient-to-r from-[#005792] to-[#00204a] relative"
            style={{
              backgroundImage: 'linear-gradient(135deg, #005792 0%, #00204a 100%)',
            }}
          >
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg">
                  <Avatar className="w-full h-full">
                    <AvatarImage src="/default-profile.png" />
                    <AvatarFallback className="text-2xl font-semibold">
                      {(driver.first_name?.[0] || '') + (driver.last_name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    title="Edit Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-6">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">
                  {driver.user_type?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-16 px-6 pb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {driver.first_name} {driver.last_name}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {driver.email}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-gray-700">
                  {driver.rating?.toFixed(1) || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Member Since</p>
                      <p className="text-gray-700">
                        {new Date(driver.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">First Name</Label>
                          <Input
                            id="first_name"
                            name="first_name"
                            value={formData.first_name || ''}
                            onChange={handleInputChange}
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">Last Name</Label>
                          <Input
                            id="last_name"
                            name="last_name"
                            value={formData.last_name || ''}
                            onChange={handleInputChange}
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">Phone Number</Label>
                          <Input
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number || ''}
                            onChange={handleInputChange}
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-gray-700">
                            {driver.first_name} {driver.last_name}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone Number</p>
                          <p className="text-gray-700">
                            {driver.phone_number || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                    Vehicle Information
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_model" className="text-sm font-medium text-gray-700">Vehicle Model</Label>
                        <Input
                          id="vehicle_model"
                          name="vehicle_model"
                          value={formData.vehicle_model || ''}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_color" className="text-sm font-medium text-gray-700">Color</Label>
                          <Input
                            id="vehicle_color"
                            name="vehicle_color"
                            value={formData.vehicle_color || ''}
                            onChange={handleInputChange}
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_plate" className="text-sm font-medium text-gray-700">License Plate</Label>
                          <Input
                            id="vehicle_plate"
                            name="vehicle_plate"
                            value={formData.vehicle_plate || ''}
                            onChange={handleInputChange}
                            className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="license_number" className="text-sm font-medium text-gray-700">Driver's License</Label>
                        <Input
                          id="license_number"
                          name="license_number"
                          value={formData.license_number || ''}
                          onChange={handleInputChange}
                          className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vehicle</p>
                        <p className="text-gray-700">
                          {driver.vehicle_model ? (
                            <>{driver.vehicle_model} <span className="text-gray-400">•</span> {driver.vehicle_color}</>
                          ) : 'Not provided'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">License Plate</p>
                        <p className="text-gray-700">
                          {driver.vehicle_plate || 'Not provided'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Driver's License</p>
                        <p className="text-gray-700">
                          {driver.license_number || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

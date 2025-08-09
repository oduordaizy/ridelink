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
    <>
    <div className="bg-blue-50">
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center bg-[#005792] p-4 justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/default-profile.png" />
              <AvatarFallback>{(driver.first_name?.[0] || '') + (driver.last_name?.[0] || '')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                {driver.first_name} {driver.last_name}
              </CardTitle>
              <p className="text-sm text-gray-500">{driver.email}</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {driver.user_type}
              </Badge>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          )}
        </CardHeader>
        
        <Separator />
        
        <CardContent className="mt-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                  <Input
                    id="vehicle_model"
                    name="vehicle_model"
                    value={formData.vehicle_model || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle_color">Vehicle Color</Label>
                  <Input
                    id="vehicle_color"
                    name="vehicle_color"
                    value={formData.vehicle_color || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicle_plate">License Plate</Label>
                  <Input
                    id="vehicle_plate"
                    name="vehicle_plate"
                    value={formData.vehicle_plate || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">First Name</p>
                <p className="text-gray-900">{driver.first_name || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Last Name</p>
                <p className="text-gray-900">{driver.last_name || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{driver.email || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-gray-900">{driver.phone_number || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">License Number</p>
                <p className="text-gray-900">{driver.license_number || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Vehicle Model</p>
                <p className="text-gray-900">{driver.vehicle_model || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Vehicle Color</p>
                <p className="text-gray-900">{driver.vehicle_color || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">License Plate</p>
                <p className="text-gray-900">{driver.vehicle_plate || 'Not provided'}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Rating</p>
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span>{driver.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="text-gray-900">
                  {new Date(driver.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
   </>
  )
}

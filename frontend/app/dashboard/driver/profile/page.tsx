'use client'
import { API_BASE_URL } from '@/app/services/api';

import { useEffect, useState, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { useAuth } from "@/app/contexts/AuthContext"
import { FaUser, FaPhone, FaCar, FaPalette, FaIdCard, FaCamera, FaStar } from "react-icons/fa6"

type DriverProfile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  user_type: string
  profile_picture: string | null
  created_at: string
  license_number: string
  vehicle_model: string
  vehicle_color: string
  vehicle_plate: string
  rating: number
}

export default function DriverProfilePage() {
  const { updateUser } = useAuth()
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<DriverProfile>>({})
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("No access token found")
        const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to load profile")
        const data = await res.json()
        setDriver(data)
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          license_number: data.license_number,
          vehicle_model: data.vehicle_model,
          vehicle_color: data.vehicle_color,
          vehicle_plate: data.vehicle_plate,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePicture(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found")

      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined) payload.append(key, value as string)
      })
      if (newProfilePicture) payload.append("profile_picture", newProfilePicture)

      const res = await fetch(`${API_BASE_URL}/auth/profile/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      })

      if (!res.ok) throw new Error("Failed to update profile")
      const updatedData = await res.json()
      setDriver(updatedData)
      updateUser(updatedData)
      setIsEditing(false)
      setNewProfilePicture(null)
      toast.success("Profile updated successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !driver) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#08A6F6] border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00204a] mb-2">Driver Profile</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage your profile and vehicle information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header with Avatar */}
          <div className="bg-gradient-to-r from-[#08A6F6] to-[#00204a] px-6 sm:px-8 pt-8 pb-20">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white shadow-xl">
                  <AvatarImage
                    src={
                      newProfilePicture
                        ? URL.createObjectURL(newProfilePicture)
                        : driver?.profile_picture || "/default-profile.png"
                    }
                    alt="Profile picture"
                  />
                  <AvatarFallback className="text-2xl bg-white text-[#08A6F6]">
                    {(driver?.first_name?.[0] || "") + (driver?.last_name?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-[#08A6F6] hover:bg-[#00204a] p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                    <FaCamera className="text-white text-sm" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left text-white mt-2">
                <h2 className="text-2xl font-bold">
                  {driver?.first_name} {driver?.last_name}
                </h2>
                <p className="text-blue-100 text-sm mt-1">{driver?.email}</p>
                {driver?.rating && (
                  <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                    <FaStar className="text-yellow-300" />
                    <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 sm:px-8 pb-8 -mt-12">
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#00204a] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="text-[#08A6F6]" />
                    First Name
                  </label>
                  <input
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="text-[#08A6F6]" />
                    Last Name
                  </label>
                  <input
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="text-[#08A6F6]" />
                    Phone Number
                  </label>
                  <input
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#00204a] mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaCar className="text-[#08A6F6]" />
                    Vehicle Model
                  </label>
                  <input
                    name="vehicle_model"
                    value={formData.vehicle_model || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., Toyota Corolla"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaPalette className="text-[#08A6F6]" />
                    Vehicle Color
                  </label>
                  <input
                    name="vehicle_color"
                    value={formData.vehicle_color || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., White"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaIdCard className="text-[#08A6F6]" />
                    License Plate
                  </label>
                  <input
                    name="vehicle_plate"
                    value={formData.vehicle_plate || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g., KAA 123B"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaIdCard className="text-[#08A6F6]" />
                    Driver&apos;s License
                  </label>
                  <input
                    name="license_number"
                    value={formData.license_number || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="License number"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08A6F6] disabled:bg-gray-100 disabled:text-gray-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setNewProfilePicture(null)
                      setFormData({
                        first_name: driver?.first_name,
                        last_name: driver?.last_name,
                        phone_number: driver?.phone_number,
                        license_number: driver?.license_number,
                        vehicle_model: driver?.vehicle_model,
                        vehicle_color: driver?.vehicle_color,
                        vehicle_plate: driver?.vehicle_plate,
                      })
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-8 py-3 bg-[#08A6F6] hover:bg-[#00204a] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-3 bg-[#08A6F6] hover:bg-[#00204a] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
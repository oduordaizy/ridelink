'use client'

import { useEffect, useState, ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { useAuth } from "@/app/contexts/AuthContext"

type DriverProfile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  user_type: string
  profile_picture: string | null // URL from backend
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

  // Fetch driver profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        if (!token) throw new Error("No access token found")
        const res = await fetch("http://127.0.0.1:8000/api/auth/profile/", {
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

      const res = await fetch("http://127.0.0.1:8000/api/auth/profile/", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }, // FormData sets Content-Type automatically
        body: payload,
      })

      if (!res.ok) throw new Error("Failed to update profile")
      const updatedData = await res.json()
      setDriver(updatedData)
      updateUser(updatedData)
      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !driver) return <p className="text-center py-10">Loading...</p>
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-4">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={
                    newProfilePicture
                      ? URL.createObjectURL(newProfilePicture)
                      : driver?.profile_picture || "/default-profile.png"
                  }
                  alt="Profile picture"
                />
                <AvatarFallback>
                  {(driver?.first_name?.[0] || "") + (driver?.last_name?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="ml-4"
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>First Name</Label>
              <Input
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                name="phone_number"
                value={formData.phone_number || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Vehicle Model</Label>
              <Input
                name="vehicle_model"
                value={formData.vehicle_model || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Vehicle Color</Label>
              <Input
                name="vehicle_color"
                value={formData.vehicle_color || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>License Plate</Label>
              <Input
                name="vehicle_plate"
                value={formData.vehicle_plate || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Driver&apos;s License</Label>
              <Input
                name="license_number"
                value={formData.license_number || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            {isEditing ? (
              <div className="flex space-x-4 mt-4">
                <Button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

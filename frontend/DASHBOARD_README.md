# RideLink Dashboard

This document describes the dashboard functionality for the RideLink application.

## Overview

The dashboard system provides separate interfaces for passengers and drivers, with role-based access control and user-specific features.

## Dashboard Structure

### Main Dashboard (`/dashboard`)
- Redirects users to their appropriate dashboard based on user type
- Handles authentication checks
- Shows loading state while determining user type

### Passenger Dashboard (`/dashboard/passenger`)
Features:
- **Tabbed Interface**: Overview, Book a Ride, Ride History
- **Ride Booking**: Complete booking form with fare estimation
- **Quick Actions**: Book a ride, view active rides, edit profile
- **Statistics**: Total rides, total spent, rating, monthly rides
- **Ride History**: Recent rides with status indicators
- **Balance Management**: View and add funds to wallet

Key Components:
- **Ride Booking Form**: Pickup location, destination, pickup time, special instructions
- **Fare Estimation**: Real-time fare calculation with distance and time estimates
- **Booking Confirmation**: One-click ride booking with driver assignment
- **Active ride tracking**
- **Payment management**
- **Profile settings**

### Driver Dashboard (`/dashboard/driver`)
Features:
- **Online/Offline Toggle**: Control availability status
- **Quick Actions**: View active rides, earnings, vehicle management
- **Statistics**: Today's earnings, weekly earnings, rating, total rides
- **Ride Requests**: Accept/decline incoming ride requests
- **Earnings Tracking**: Real-time earnings display

Key Components:
- Ride request management
- Earnings dashboard
- Vehicle information
- Status controls

## API Integration

The dashboard uses the following API endpoints:

### Passenger APIs
- `GET /api/rides/passenger/history/` - Get ride history
- `GET /api/rides/passenger/active/` - Get active rides
- `POST /api/rides/estimate/` - Estimate ride fare
- `POST /api/rides/book/` - Book a ride
- `POST /api/rides/passenger/cancel/{id}/` - Cancel a ride
- `GET /api/auth/profile/` - Get user profile

### Driver APIs
- `GET /api/rides/driver/requests/` - Get ride requests
- `GET /api/rides/driver/earnings/` - Get earnings data
- `POST /api/rides/driver/accept/{id}/` - Accept ride request
- `POST /api/rides/driver/decline/{id}/` - Decline ride request

## Authentication

All dashboard routes require authentication. Users are redirected to `/auth/login` if not authenticated.

## User Type Detection

The system automatically detects user type from the authentication response and routes to the appropriate dashboard:
- `user_type: 'driver'` → `/dashboard/driver`
- `user_type: 'passenger'` → `/dashboard/passenger`

## Styling

The dashboards use:
- Tailwind CSS for styling
- Blue accent color scheme (matching project theme)
- Responsive design for mobile and desktop
- Modern card-based layout
- Loading states and animations

## Navigation

The navbar includes a "Dashboard" link for authenticated users that routes to `/dashboard`.

## Future Enhancements

- Real-time ride tracking with live driver location
- Push notifications for ride updates
- Advanced analytics and reporting
- Payment integration with multiple methods
- Driver earnings withdrawal system
- Passenger ride scheduling (advance booking)
- Ride sharing options
- Driver and passenger ratings system
- Emergency contact integration
- Route optimization and traffic integration 
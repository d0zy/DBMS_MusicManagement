"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookingForm } from "../components/booking-form";
import { supabase } from "../lib/supabase";
import { Header } from "../components/header";
import { Button } from "../components/ui/button";

export default function BookingPage() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by looking for data in localStorage
    const storedUser = localStorage.getItem("musicClubUser");

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("musicClubUser");
        router.push("/login");
      }
    } else {
      // No user found, redirect to login page
      router.push("/login");
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="mb-4">You need to sign in to book a music room.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="container mx-auto py-8 px-4 flex-grow">
        <h1 className="text-2xl font-bold mb-8 text-center">Music Room Booking</h1>

        <BookingForm 
          userId={user.id} 
          userName={user.name} 
          onSuccess={() => {
            // In a real application, this might redirect to a booking confirmation page
            // or refresh the list of user's bookings
          }}
        />

        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
          <p>
            Your upcoming bookings will appear here. This feature will be implemented in the next phase.
          </p>
        </div>
      </div>

      <footer className="bg-gray-800 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2023 Music Club Management System. All rights reserved.</p>
          <p className="text-gray-600 mt-2">Powered by Supabase</p>
        </div>
      </footer>
    </div>
  );
}

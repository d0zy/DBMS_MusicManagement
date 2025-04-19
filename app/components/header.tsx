"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function Header() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // Check if user is logged in
    const storedUser = localStorage.getItem("musicClubUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("musicClubUser");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("musicClubUser");
    setUser(null);
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold cursor-pointer">Music Club Management</h1>
        </Link>
        <nav className="flex items-center gap-4">
          {isClient && user ? (
            <>
              <span className="text-sm">Welcome, {user.name}</span>
              <Link href="/booking">
                <Button variant="outline">Book a Room</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/booking">
                <Button>Book a Room</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
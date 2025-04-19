import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Header } from "./components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to the Music Club</h2>
            <p className="text-xl mb-8">
              Book music rooms, manage instruments, and connect with other members.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Room Booking</CardTitle>
                <CardDescription>Reserve a music room for practice or events</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Rooms can be booked after 10pm the previous day. Operating hours are from 8:00 AM to 2:00 AM the next day. Check availability and book your slot.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/booking" className="w-full">
                  <Button className="w-full">Book Now</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruments</CardTitle>
                <CardDescription>Browse available instruments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View our collection of instruments available for use in the music rooms.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>Connect with other musicians</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Find other members with similar interests and collaborate on music projects.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>

      <footer className="bg-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2023 Music Club Management System. All rights reserved.</p>
          <p className="text-gray-600 mt-2">Powered by Supabase</p>
        </div>
      </footer>
    </div>
  );
}

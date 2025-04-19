"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
}

interface RoomSelectorProps {
  onSelectRoom: (room: Room) => void;
  selectedRoomId?: string;
}

export function RoomSelector({ onSelectRoom, selectedRoomId }: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        const response = await fetch("/api/rooms");

        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }

        const data = await response.json();
        setRooms(data);
      } catch (err) {
        setError("Error loading rooms. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center p-4">
        <p>No rooms available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <Card 
          key={room.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedRoomId === room.id ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => onSelectRoom(room)}
        >
          <CardHeader>
            <CardTitle>{room.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{room.description || "No description available"}</p>
            <p className="mt-2 text-sm">Capacity: {room.capacity} people</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

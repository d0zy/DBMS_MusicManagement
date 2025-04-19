"use client";

import { useState, FormEvent, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { RoomSelector } from "./room-selector";
import { canBookForDate } from "../utils/date";

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
}

interface BookingFormProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
  startHour: number;
  formattedStartTime: string;
  formattedEndTime: string;
}

export function BookingForm({ userId, userName, onSuccess }: BookingFormProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Update end time to be 59 minutes after start time whenever start time changes
  const updateEndTime = (newStartTime: string) => {
    if (newStartTime) {
      const [hours, minutes] = newStartTime.split(':').map(Number);
      // Ensure minutes are always 00 for round hours
      setEndTime(`${hours.toString().padStart(2, '0')}:59`);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form validation
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Fetch available slots when date and room are selected
  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!date || !selectedRoom) return;

      try {
        setLoadingSlots(true);
        setSlotsError(null);

        const response = await fetch(`/api/available-slots?roomId=${selectedRoom.id}&date=${date}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch available slots');
        }

        const slots = await response.json();
        setAvailableSlots(slots);

        // Clear selected time if it's no longer available
        if (startTime && !slots.some(slot => slot.formattedStartTime === startTime)) {
          setStartTime('');
          setEndTime('');
        }
      } catch (err) {
        if (err instanceof Error) {
          setSlotsError(err.message);
        } else {
          setSlotsError('An unexpected error occurred');
        }
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailableSlots();
  }, [date, selectedRoom]);

  // Handle slot selection
  const handleSlotSelect = (slot: AvailableSlot) => {
    setStartTime(slot.formattedStartTime);
    setEndTime(slot.formattedEndTime);
    setTimeError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset errors
    setError(null);
    setDateError(null);
    setTimeError(null);
    setRoomError(null);

    // Validate form
    let isValid = true;

    if (!selectedRoom) {
      setRoomError("Please select a room");
      isValid = false;
    }

    if (!date) {
      setDateError("Please select a date");
      isValid = false;
    }

    if (!startTime || !endTime) {
      setTimeError("Please select both start and end times");
      isValid = false;
    }

    // Check if end time is after start time
    if (startTime && endTime) {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (endDateTime <= startDateTime) {
        setTimeError("End time must be after start time");
        isValid = false;
      }
    }

    // Check if booking is allowed (after 10pm the previous day)
    if (date) {
      const bookingDate = new Date(date);
      if (!canBookForDate(bookingDate)) {
        setDateError("Bookings can only be made after 10pm the previous day");
        isValid = false;
      }
    }

    if (!isValid) return;

    try {
      setLoading(true);

      // Create Date objects with local timezone offset to preserve the local time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDateTime = new Date(date);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(date);
      endDateTime.setHours(endHour, endMinute, 59, 0);

      // Send date components separately to preserve local time
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          roomId: selectedRoom?.id,
          date,
          startHour,
          startMinute,
          endHour,
          endMinute,
          purpose,
          // Include timezone offset for debugging
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setSuccess(true);

      // Reset form
      setSelectedRoom(null);
      setDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Book a Music Room</CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="font-medium">Booking successful!</p>
            <p className="text-sm mt-1">Your room has been booked successfully.</p>
            <Button 
              className="mt-2" 
              onClick={() => setSuccess(false)}
            >
              Make another booking
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Select a Room</h3>
              <div className="mb-2">
                <RoomSelector 
                  onSelectRoom={(room) => {
                    setSelectedRoom(room);
                    setRoomError(null);
                  }}
                  selectedRoomId={selectedRoom?.id}
                />
              </div>
              {roomError && <p className="text-sm text-red-500">{roomError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                type="date"
                label="Date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDateError(null);
                }}
                error={dateError || undefined}
                min={new Date().toISOString().split('T')[0]}
              />

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Time Slots
                </label>

                {loadingSlots && (
                  <div className="flex justify-center items-center p-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-r-transparent"></div>
                  </div>
                )}

                {slotsError && (
                  <div className="p-4 bg-red-50 rounded-md">
                    <p className="text-sm text-red-500">{slotsError}</p>
                  </div>
                )}

                {!loadingSlots && !slotsError && availableSlots.length === 0 && date && selectedRoom && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm">No available slots for this date. Please try another date.</p>
                  </div>
                )}

                {!loadingSlots && !slotsError && availableSlots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        className={`p-2 text-sm rounded-md border ${
                          startTime === slot.formattedStartTime
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        {slot.formattedStartTime}
                      </button>
                    ))}
                  </div>
                )}

                {timeError && <p className="text-sm text-red-500 mt-1">{timeError}</p>}
              </div>
            </div>

            <Input
              label="Purpose (optional)"
              placeholder="What will you be using the room for?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mb-4"
            />

            <div className="mt-6">
              <Button type="submit" isLoading={loading} className="w-full">
                Book Room
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        <div>
          <p>Note: Rooms can only be booked after 10pm the previous day.</p>
          <p>Operating hours are from 8:00 AM to 2:00 AM the next day.</p>
          <p>All booking slots are 59 minutes (e.g., 8:00-8:59) and must start at round hours (e.g., 8:00, 9:00).</p>
          <p>Bookings after midnight (e.g., 1:00 AM on April 20th) are counted as bookings for the previous day (April 19th).</p>
          <p>On weekdays, you can book only 1 slot per day in the range 8:00 AM to 2:00 AM the next day.</p>
          <p>On weekends (Saturday and Sunday), you can book up to 2 slots per day.</p>
          <p>Only available slots are displayed for selection.</p>
        </div>
      </CardFooter>
    </Card>
  );
}

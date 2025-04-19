import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { canBookForDate } from '@/app/utils/date';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');

    // Validate required parameters
    if (!roomId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId and date' },
        { status: 400 }
      );
    }

    // Parse the date
    const searchDate = new Date(date);

    // Check if booking is allowed for this date (after 10pm the previous day)
    if (!canBookForDate(searchDate)) {
      return NextResponse.json(
        { error: 'Bookings can only be made after 10pm the previous day' },
        { status: 400 }
      );
    }

    // Set the date to midnight to get all bookings for the day
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Include bookings until 2 AM the next day
    const endOfNextDay = new Date(searchDate);
    endOfNextDay.setDate(endOfNextDay.getDate() + 1);
    endOfNextDay.setHours(2, 0, 0, 0);

    // Get all existing bookings for the room on the specified date and early hours of next day
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        OR: [
          // Bookings that start on the selected date
          {
            startTime: {
              gte: startOfDay,
              lt: endOfNextDay,
            },
          },
          // Bookings from previous day that end on the selected date (early morning)
          {
            startTime: {
              lt: startOfDay,
            },
            endTime: {
              gt: startOfDay,
            },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Define the operating hours (8:00 AM to 2:00 AM the next day)
    const operatingStartHour = 8; // 8 AM
    const operatingEndHour = 26;  // 2 AM next day (represented as 26:00)

    // Generate all possible 1-hour slots within operating hours
    const allSlots = [];
    for (let hour = operatingStartHour; hour < operatingEndHour; hour++) {
      const slotStart = new Date(searchDate);
      const actualHour = hour % 24; // Convert 24+ hour to 0-23 range
      slotStart.setHours(actualHour, 0, 0, 0);

      // If hour >= 24, it's the next day
      if (hour >= 24) {
        slotStart.setDate(slotStart.getDate() + 1);
      }

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(59);
      slotEnd.setSeconds(59);

      allSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: true,
      });
    }

    // Mark slots as unavailable if they overlap with existing bookings
    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      for (const slot of allSlots) {
        // Check if the slot overlaps with the booking
        if (
          (slot.startTime >= bookingStart && slot.startTime < bookingEnd) ||
          (slot.endTime > bookingStart && slot.endTime <= bookingEnd) ||
          (slot.startTime <= bookingStart && slot.endTime >= bookingEnd)
        ) {
          slot.available = false;
        }
      }
    }

    // Filter to only include available slots
    const availableSlots = allSlots.filter(slot => slot.available);

    // Format the response
    const formattedSlots = availableSlots.map(slot => ({
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      startHour: slot.startTime.getHours(),
      formattedStartTime: `${slot.startTime.getHours().toString().padStart(2, '0')}:00`,
      formattedEndTime: `${slot.startTime.getHours().toString().padStart(2, '0')}:59`,
    }));

    // Sort slots to make 00:00 and 01:00 appear first
    formattedSlots.sort((a, b) => {
      // If a is 00:00 or 01:00, it should come first
      if ((a.startHour === 0 || a.startHour === 1) && !(b.startHour === 0 || b.startHour === 1)) {
        return -1;
      }
      // If b is 00:00 or 01:00, it should come first
      if ((b.startHour === 0 || b.startHour === 1) && !(a.startHour === 0 || a.startHour === 1)) {
        return 1;
      }
      // Otherwise, sort by hour
      return a.startHour - b.startHour;
    });

    return NextResponse.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}

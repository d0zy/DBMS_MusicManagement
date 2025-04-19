import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { canBookForDate, toGMT530, isWeekendInGMT530 } from '@/app/utils/date';

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

    // Convert to GMT +5:30 for consistent timezone handling
    const searchDateGMT530 = toGMT530(searchDate);

    // Check if booking is allowed for this date (after 10pm the previous day)
    if (!canBookForDate(searchDate)) {
      return NextResponse.json(
        { error: 'Bookings can only be made after 10pm the previous day' },
        { status: 400 }
      );
    }

    // Get the date part only in GMT +5:30 format (YYYY-MM-DD)
    const dateOnlyGMT530 = searchDateGMT530.toISOString().split('T')[0];

    // Set the date to midnight in GMT +5:30 to get all bookings for the day
    const startOfDayGMT530 = new Date(dateOnlyGMT530 + 'T00:00:00.000Z');

    // Include bookings until 2 AM the next day in GMT +5:30
    const endOfNextDayGMT530 = new Date(startOfDayGMT530);
    endOfNextDayGMT530.setDate(endOfNextDayGMT530.getDate() + 1);
    endOfNextDayGMT530.setHours(2, 0, 0, 0);

    // Log for debugging
    console.log(`Date in GMT+5:30: ${dateOnlyGMT530}`);
    console.log(`Day range in GMT+5:30: ${startOfDayGMT530.toISOString()} to ${endOfNextDayGMT530.toISOString()}`);
    console.log(`Is weekend in GMT+5:30: ${isWeekendInGMT530(searchDate)}`);

    // Get all existing bookings for the room
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Filter bookings that fall on the same date in GMT +5:30
    const bookingsOnSameDate = existingBookings.filter(booking => {
      const bookingStartGMT530 = toGMT530(new Date(booking.startTime));
      const bookingDateGMT530 = bookingStartGMT530.toISOString().split('T')[0];

      // Check if the booking date matches our target date in GMT +5:30
      return bookingDateGMT530 === dateOnlyGMT530;
    });

    // Log for debugging
    console.log(`Found ${bookingsOnSameDate.length} bookings on ${dateOnlyGMT530} in GMT+5:30`);

    // Define the operating hours (8:00 AM to 2:00 AM the next day)
    const operatingStartHour = 8; // 8 AM
    const operatingEndHour = 26;  // 2 AM next day (represented as 26:00)

    // Generate all possible 1-hour slots within operating hours in GMT +5:30
    const allSlots = [];
    for (let hour = operatingStartHour; hour < operatingEndHour; hour++) {
      // Create the slot start time in GMT +5:30
      const slotStartGMT530 = new Date(searchDateGMT530);
      const actualHour = hour % 24; // Convert 24+ hour to 0-23 range
      slotStartGMT530.setHours(actualHour, 0, 0, 0);

      // If hour >= 24, it's the next day
      if (hour >= 24) {
        slotStartGMT530.setDate(slotStartGMT530.getDate() + 1);
      }

      // Create the slot end time in GMT +5:30
      const slotEndGMT530 = new Date(slotStartGMT530);
      slotEndGMT530.setMinutes(59);
      slotEndGMT530.setSeconds(59);

      allSlots.push({
        startTimeGMT530: slotStartGMT530,
        endTimeGMT530: slotEndGMT530,
        available: true,
      });
    }

    // Mark slots as unavailable if they overlap with existing bookings
    for (const booking of bookingsOnSameDate) {
      // Convert booking times to GMT +5:30
      const bookingStartGMT530 = toGMT530(new Date(booking.startTime));
      const bookingEndGMT530 = toGMT530(new Date(booking.endTime));

      for (const slot of allSlots) {
        // Check if the slot overlaps with the booking in GMT +5:30
        if (
          (slot.startTimeGMT530 >= bookingStartGMT530 && slot.startTimeGMT530 < bookingEndGMT530) ||
          (slot.endTimeGMT530 > bookingStartGMT530 && slot.endTimeGMT530 <= bookingEndGMT530) ||
          (slot.startTimeGMT530 <= bookingStartGMT530 && slot.endTimeGMT530 >= bookingEndGMT530)
        ) {
          slot.available = false;
        }
      }
    }

    // Log for debugging
    console.log(`Generated ${allSlots.length} slots, ${allSlots.filter(slot => slot.available).length} available`);

    // Filter to only include available slots
    const availableSlots = allSlots.filter(slot => slot.available);

    // Format the response
    const formattedSlots = availableSlots.map(slot => {
      // Get the hour in GMT +5:30
      const startHourGMT530 = slot.startTimeGMT530.getHours();

      // Check if this slot is for the next day (by comparing dates)
      const isNextDay = slot.startTimeGMT530.getDate() > searchDateGMT530.getDate() || 
                        (slot.startTimeGMT530.getMonth() > searchDateGMT530.getMonth()) ||
                        (slot.startTimeGMT530.getFullYear() > searchDateGMT530.getFullYear());

      return {
        // Keep the original ISO strings for compatibility
        startTime: slot.startTimeGMT530.toISOString(),
        endTime: slot.endTimeGMT530.toISOString(),
        // Use the hour from GMT +5:30
        startHour: startHourGMT530,
        formattedStartTime: `${startHourGMT530.toString().padStart(2, '0')}:00`,
        formattedEndTime: `${startHourGMT530.toString().padStart(2, '0')}:59`,
        isNextDay: isNextDay, // Add this flag to indicate if the slot is for the next day
      };
    });

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

    // Log for debugging
    console.log(`Returning ${formattedSlots.length} available slots`);

    return NextResponse.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}

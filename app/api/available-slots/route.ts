import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { canBookForDate, toGMT, isWeekendInGMT } from '@/app/utils/date';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!roomId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: roomId and date' },
        { status: 400 }
      );
    }

    // Parse the date
    const searchDate = new Date(date);

    // Convert to GMT (UTC) for consistent timezone handling
    const searchDateGMT = toGMT(searchDate);

    // Check if booking is allowed for this date (after 10pm the previous day)
    if (!canBookForDate(searchDate)) {
      return NextResponse.json(
        { error: 'Bookings can only be made after 10pm the previous day' },
        { status: 400 }
      );
    }

    // Check if the date is a weekend in GMT (UTC) timezone
    const isWeekend = isWeekendInGMT(searchDate);

    // Get the date part only in GMT (UTC) format (YYYY-MM-DD)
    const dateOnlyGMT = searchDateGMT.toISOString().split('T')[0];

    // Set the date to midnight in GMT (UTC) to get all bookings for the day
    const startOfDayGMT = new Date(dateOnlyGMT + 'T00:00:00.000Z');

    // Include bookings until 2 AM the next day in GMT (UTC)
    const endOfNextDayGMT = new Date(startOfDayGMT);
    endOfNextDayGMT.setDate(endOfNextDayGMT.getDate() + 1);
    endOfNextDayGMT.setHours(2, 0, 0, 0);

    // Log for debugging
    console.log(`Date in GMT (UTC): ${dateOnlyGMT}`);
    console.log(`Day range in GMT (UTC): ${startOfDayGMT.toISOString()} to ${endOfNextDayGMT.toISOString()}`);
    console.log(`Is weekend in GMT (UTC): ${isWeekend}`);

    // Check if user has reached their booking limit for the day
    let userReachedBookingLimit = false;
    if (userId) {
      // Get the user's existing bookings
      const userBookings = await prisma.booking.findMany({
        where: {
          userId,
        },
        select: {
          startTime: true,
        },
      });

      // Filter bookings that fall on the same date in GMT (UTC)
      const userBookingsOnSameDate = userBookings.filter(booking => {
        const bookingTimeGMT = toGMT(new Date(booking.startTime));
        const bookingDateGMT = bookingTimeGMT.toISOString().split('T')[0];
        return bookingDateGMT === dateOnlyGMT;
      });

      const userBookingsCount = userBookingsOnSameDate.length;
      console.log(`User has ${userBookingsCount} bookings on ${dateOnlyGMT}`);

      // Check if user has reached their booking limit
      if (isWeekend) {
        // On weekends, users can book up to 2 slots
        userReachedBookingLimit = userBookingsCount >= 2;
      } else {
        // On weekdays, users can book only 1 slot
        userReachedBookingLimit = userBookingsCount >= 1;
      }

      console.log(`User reached booking limit: ${userReachedBookingLimit}`);
    }

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

    // Filter bookings that fall on the same date in GMT (UTC)
    const bookingsOnSameDate = existingBookings.filter(booking => {
      const bookingStartGMT = toGMT(new Date(booking.startTime));
      const bookingDateGMT = bookingStartGMT.toISOString().split('T')[0];

      // Check if the booking date matches our target date in GMT (UTC)
      return bookingDateGMT === dateOnlyGMT;
    });

    // Log for debugging
    console.log(`Found ${bookingsOnSameDate.length} bookings on ${dateOnlyGMT} in GMT (UTC)`);

    // Define the operating hours (8:00 AM to 2:00 AM the next day)
    const operatingStartHour = 8; // 8 AM
    const operatingEndHour = 26;  // 2 AM next day (represented as 26:00)

    // Generate all possible 1-hour slots within operating hours in GMT (UTC)
    const allSlots = [];
    for (let hour = operatingStartHour; hour < operatingEndHour; hour++) {
      // Create the slot start time in GMT (UTC)
      const slotStartGMT = new Date(searchDateGMT);
      const actualHour = hour % 24; // Convert 24+ hour to 0-23 range
      slotStartGMT.setHours(actualHour, 0, 0, 0);

      // If hour >= 24, it's the next day
      if (hour >= 24) {
        slotStartGMT.setDate(slotStartGMT.getDate() + 1);
      }

      // Create the slot end time in GMT (UTC)
      const slotEndGMT = new Date(slotStartGMT);
      slotEndGMT.setMinutes(59);
      slotEndGMT.setSeconds(59);

      allSlots.push({
        startTimeGMT: slotStartGMT,
        endTimeGMT: slotEndGMT,
        available: true,
      });
    }

    // Mark slots as unavailable if they overlap with existing bookings
    for (const booking of bookingsOnSameDate) {
      // Convert booking times to GMT (UTC)
      const bookingStartGMT = toGMT(new Date(booking.startTime));
      const bookingEndGMT = toGMT(new Date(booking.endTime));

      for (const slot of allSlots) {
        // Check if the slot overlaps with the booking in GMT (UTC)
        if (
          (slot.startTimeGMT >= bookingStartGMT && slot.startTimeGMT < bookingEndGMT) ||
          (slot.endTimeGMT > bookingStartGMT && slot.endTimeGMT <= bookingEndGMT) ||
          (slot.startTimeGMT <= bookingStartGMT && slot.endTimeGMT >= bookingEndGMT)
        ) {
          slot.available = false;
        }
      }
    }

    // If user has reached their booking limit, mark all slots as unavailable
    if (userId && userReachedBookingLimit) {
      console.log(`Marking all slots as unavailable because user has reached their booking limit`);
      for (const slot of allSlots) {
        slot.available = false;
      }
    }

    // Log for debugging
    console.log(`Generated ${allSlots.length} slots, ${allSlots.filter(slot => slot.available).length} available`);

    // Filter to only include available slots
    const availableSlots = allSlots.filter(slot => slot.available);

    // Format the response
    const formattedSlots = availableSlots.map(slot => {
      // Get the hour in GMT (UTC)
      const startHourGMT = slot.startTimeGMT.getHours();

      // Check if this slot is for the next day (by comparing dates)
      const isNextDay = slot.startTimeGMT.getDate() > searchDateGMT.getDate() || 
                        (slot.startTimeGMT.getMonth() > searchDateGMT.getMonth()) ||
                        (slot.startTimeGMT.getFullYear() > searchDateGMT.getFullYear());

      return {
        // Keep the original ISO strings for compatibility
        startTime: slot.startTimeGMT.toISOString(),
        endTime: slot.endTimeGMT.toISOString(),
        // Use the hour from GMT (UTC)
        startHour: startHourGMT,
        formattedStartTime: `${startHourGMT.toString().padStart(2, '0')}:00`,
        formattedEndTime: `${startHourGMT.toString().padStart(2, '0')}:59`,
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

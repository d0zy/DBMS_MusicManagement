import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { canBookForDate } from '@/app/utils/date';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      roomId, 
      date, 
      startHour, 
      startMinute, 
      endHour, 
      endMinute, 
      purpose,
      timezoneOffset 
    } = body;

    // Validate required fields
    if (!userId || !roomId || !date || startHour === undefined || startMinute === undefined || 
        endHour === undefined || endMinute === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist, create it
    if (!user) {
      await prisma.user.create({
        data: {
          id: userId,
          name: 'Mock User',
          email: `user-${userId}@example.com`,
        },
      });
    }

    // Create Date objects with the correct local time
    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMinute, 59, 0);

    // Log for debugging
    console.log(`Booking time - Local: ${startDate.toLocaleString()}, ISO: ${startDate.toISOString()}, Timezone offset: ${timezoneOffset}`);

    // Check if booking is allowed (after 10pm the previous day)
    if (!canBookForDate(startDate)) {
      return NextResponse.json(
        { error: 'Bookings can only be made after 10pm the previous day' },
        { status: 400 }
      );
    }

    // Check if the time slot is 59 minutes and 59 seconds
    const timeDifferenceMs = endDate.getTime() - startDate.getTime();
    const fiftyNineMinutesMs = 59 * 60 * 1000 + 59 * 1000; // 59 minutes and 59 seconds
    if (Math.abs(timeDifferenceMs - fiftyNineMinutesMs) > 1000) { // Allow 1 second tolerance for potential rounding
      return NextResponse.json(
        { error: 'Booking slots must be exactly 59 minutes and 59 seconds' },
        { status: 400 }
      );
    }

    // Check if booking starts at a round hour (minutes and seconds must be 0)
    if (startDate.getMinutes() !== 0 || startDate.getSeconds() !== 0) {
      return NextResponse.json(
        { error: 'Bookings must start at round hours (e.g., 7:00, 8:00)' },
        { status: 400 }
      );
    }

    // Check if the date is a weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = startDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Get the operating hours range (8:00 AM to 2:00 AM the next day)
    const operatingStartDate = new Date(startDate);
    operatingStartDate.setHours(8, 0, 0, 0);

    const operatingEndDate = new Date(startDate);
    operatingEndDate.setDate(operatingEndDate.getDate() + 1);
    operatingEndDate.setHours(2, 0, 0, 0);

    // Count how many bookings the user already has in the operating hours range
    const userBookingsInRange = await prisma.booking.count({
      where: {
        userId,
        startTime: {
          gte: operatingStartDate,
          lt: operatingEndDate,
        },
      },
    });

    if (isWeekend) {
      // On weekends, users can book up to 2 slots
      if (userBookingsInRange >= 2) {
        return NextResponse.json(
          { error: 'You can only book up to 2 slots on weekends' },
          { status: 400 }
        );
      }
    } else {
      // On weekdays, users can book only 1 slot
      if (userBookingsInRange >= 1) {
        return NextResponse.json(
          { error: 'You can only book 1 slot per day on weekdays' },
          { status: 400 }
        );
      }
    }

    // Check if the room is available for the requested time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        OR: [
          {
            // New booking starts during an existing booking
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gt: startDate } },
            ],
          },
          {
            // New booking ends during an existing booking
            AND: [
              { startTime: { lt: endDate } },
              { endTime: { gte: endDate } },
            ],
          },
          {
            // New booking completely contains an existing booking
            AND: [
              { startTime: { gte: startDate } },
              { endTime: { lte: endDate } },
            ],
          },
        ],
      },
    });

    // For bookings after midnight (0:00 - 2:00), associate them with the previous day
    // This is handled by the frontend when selecting slots, but we ensure it here as well
    const hour = startDate.getHours();
    if (hour >= 0 && hour < 2) {
      // This is an early morning booking (after midnight)
      // The startDate should already be set to the correct day by the frontend
      // We just need to make sure the validation logic is consistent
    }

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Room is already booked for this time' },
        { status: 409 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        startTime: startDate,
        endTime: endDate,
        purpose,
        status: 'confirmed', // Auto-confirm for now
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');

    let whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (roomId) {
      whereClause.roomId = roomId;
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.startTime = {
        gte: searchDate,
        lt: nextDay,
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
        user: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

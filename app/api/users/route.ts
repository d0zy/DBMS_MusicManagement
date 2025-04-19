import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate a unique email based on the name and current timestamp
    const timestamp = Date.now();
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${timestamp}@example.com`;

    // Create a new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (name) {
      // Find users with the given name
      const users = await prisma.user.findMany({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(users);
    }

    // If no name is provided, return all users
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
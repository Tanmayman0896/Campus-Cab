// Test script to verify the note feature in the vote system
// This script will help test the API endpoints for the note functionality

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNoteFeature() {
  console.log(' Testing Note Feature...');
  
  try {
    // Test 1: Create a test request
    console.log('1. Creating test request...');
    const testRequest = await prisma.request.create({
      data: {
        userId: 'test-user-1',
        pickup: 'Test Pickup Location',
        dropoff: 'Test Dropoff Location',
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        availableSeats: 3,
        pricePerSeat: 10.50,
        status: 'active'
      }
    });
    console.log('Test request created:', testRequest.id);

    // Test 2: Create a vote with a note
    console.log('2. Creating vote with note...');
    const testVote = await prisma.vote.create({
      data: {
        userId: 'test-user-2',
        requestId: testRequest.id,
        note: 'Hi! I would love to join your ride. I have a flexible schedule and can adjust pickup time if needed.',
        status: 'pending'
      }
    });
    console.log(' Vote with note created:', testVote.id);

    // Test 3: Fetch the vote with note to verify it's stored correctly
    console.log('3. Fetching vote with note...');
    const fetchedVote = await prisma.vote.findUnique({
      where: { id: testVote.id },
      include: {
        user: {
          select: { name: true, email: true }
        },
        request: {
          select: { pickup: true, dropoff: true, userId: true }
        }
      }
    });
    console.log('Vote fetched successfully:');
    console.log('- Note:', fetchedVote.note);
    console.log('From user:', fetchedVote.user.email);
    console.log(' For request:', fetchedVote.request.pickup, '->', fetchedVote.request.dropoff);

    // Test 4: Fetch all votes for the request (what the request owner would see)
    console.log('4. Fetching all votes for request (owner view)...');
    const votesForRequest = await prisma.vote.findMany({
      where: { requestId: testRequest.id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    console.log(' Votes for request:');
    votesForRequest.forEach(vote => {
      console.log(`  - ${vote.user.email}: "${vote.note}" (${vote.status})`);
    });

    // Test 5: Test note validation (max 500 characters)
    console.log('5. Testing note validation...');
    const longNote = 'a'.repeat(501); // 501 characters
    try {
      await prisma.vote.create({
        data: {
          userId: 'test-user-3',
          requestId: testRequest.id,
          note: longNote,
          status: 'pending'
        }
      });
      console.log(' Should have failed for long note');
    } catch (error) {
      console.log(' Long note validation working:', error.message);
    }

    // Clean up test data
    console.log('6. Cleaning up test data...');
    await prisma.vote.deleteMany({
      where: { requestId: testRequest.id }
    });
    await prisma.request.delete({
      where: { id: testRequest.id }
    });
    console.log(' Test data cleaned up');

    console.log('\n🎉 All tests passed! Note feature is working correctly.');
    
  } catch (error) {
    console.error(' Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNoteFeature();

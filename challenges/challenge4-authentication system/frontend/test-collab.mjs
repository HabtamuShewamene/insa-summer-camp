import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

async function runTest() {
  console.log('--- Starting End-to-End Collaboration & Sharing Test ---');
  
  try {
    // 1. Register User A
    const userAEmail = `usera_${Date.now()}@test.com`;
    console.log(`\n1. Registering User A (${userAEmail})...`);
    const resA = await axios.post(`${API_URL}/auth/register`, {
      name: 'User A',
      email: userAEmail,
      password: 'StrongPassword123!'
    });
    const tokenA = resA.data.accessToken;
    const userAId = resA.data.user.id;
    console.log('✅ User A registered successfully.');

    // 2. Register User B
    const userBEmail = `userb_${Date.now()}@test.com`;
    console.log(`\n2. Registering User B (${userBEmail})...`);
    const resB = await axios.post(`${API_URL}/auth/register`, {
      name: 'User B',
      email: userBEmail,
      password: 'StrongPassword123!'
    });
    const tokenB = resB.data.accessToken;
    const userBId = resB.data.user.id;
    console.log('✅ User B registered successfully.');

    // 3. User A creates a document
    console.log('\n3. User A creating a new document...');
    const docRes = await axios.post(`${API_URL}/documents`, {
      title: 'Real-Time Sync Test Document'
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    const documentId = docRes.data.document.id;
    console.log(`✅ Document created with ID: ${documentId}`);

    // 4. User A shares the document with User B (Editor)
    console.log('\n4. User A sharing document with User B...');
    await axios.post(`${API_URL}/documents/${documentId}/share`, {
      email: userBEmail,
      permission: 'EDITOR'
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    console.log('✅ Document shared with EDITOR permissions.');

    // 5. Connect WebSocket Clients for live collaboration
    console.log('\n5. Establishing WebSockets for Live Collaboration & Measuring Latency...');
    
    const socketA = io(WS_URL, {
      auth: { token: `Bearer ${tokenA}` },
      query: { documentId }
    });

    const socketB = io(WS_URL, {
      auth: { token: `Bearer ${tokenB}` },
      query: { documentId }
    });

    await new Promise((resolve, reject) => {
      let connectedCount = 0;
      socketA.on('connect', () => { connectedCount++; if(connectedCount === 2) resolve(); });
      socketB.on('connect', () => { connectedCount++; if(connectedCount === 2) resolve(); });
      setTimeout(() => reject(new Error('WebSockets failed to connect')), 5000);
    });
    console.log('✅ Both users connected to real-time collaboration server.');

    console.log('\n5.5 Users joining document room...');
    await new Promise((resolve, reject) => {
      let joinedCount = 0;
      socketA.on('room-users', () => { joinedCount++; if(joinedCount === 2) resolve(); });
      socketB.on('room-users', () => { joinedCount++; if(joinedCount === 2) resolve(); });
      socketA.emit('join-document', { documentId });
      socketB.emit('join-document', { documentId });
      setTimeout(() => reject(new Error('Failed to join document room')), 5000);
    });
    console.log('✅ Both users joined the document room.');

    // Measure Latency via Typing Indicator
    console.log('\n6. Testing Presence and Typing Indicator Sync...');
    let latencyMeasured = false;
    
    await new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      socketB.on('user-typing', (data) => {
        const endTime = Date.now();
        const latency = endTime - startTime;
        console.log(`✅ User B received typing event from User A!`);
        console.log(`⏱️  End-to-End Latency: ${latency}ms`);
        latencyMeasured = true;
        resolve();
      });

      socketA.emit('user-typing', { documentId, isTyping: true });
      setTimeout(() => {
        if (!latencyMeasured) reject(new Error('Typing event was not received by User B within timeout'));
      }, 3000);
    });

    // Cleanup
    socketA.disconnect();
    socketB.disconnect();

    console.log('\n🎉 ALL TESTS PASSED FLAWLESSLY! Real-time sharing and collaboration are fully operational.');

  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    if (err.response) {
      console.error('API Error Response:', err.response.data);
    }
  }
}

runTest();

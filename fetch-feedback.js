/**
 * FlowTrails Feedback Queue Manager
 *
 * Usage:
 *   node fetch-feedback.js              - Auto-claim next "new" item (by priority)
 *   node fetch-feedback.js list         - List all feedback with status
 *   node fetch-feedback.js <id>         - View specific feedback
 *   node fetch-feedback.js <id> <status> "notes" - Update status
 *   node fetch-feedback.js <id> priority <low|medium|high> - Update priority
 *   node fetch-feedback.js delete <id>  - Delete feedback item
 *
 * Statuses: new, in-progress, completed, archived
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

// Load service account key
const serviceAccountPath = './serviceAccountKey.json';
if (!existsSync(serviceAccountPath)) {
  console.error('\n  ❌ Missing serviceAccountKey.json');
  console.error('  Place your Firebase service account key at the project root.\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const COLLECTION = 'flowtrails-feedback';

// Stale claim threshold (2 hours)
const STALE_CLAIM_MS = 2 * 60 * 60 * 1000;

/**
 * List all feedback with queue status summary
 */
async function listAllFeedback() {
  console.log('\n📋 FlowTrails Feedback Queue\n');
  console.log('='.repeat(70));

  const snapshot = await db.collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();

  if (snapshot.empty) {
    console.log('\n  No feedback found.\n');
    return;
  }

  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Count by status
  const counts = { new: 0, 'in-progress': 0, completed: 0, archived: 0 };
  items.forEach(item => {
    const status = item.status || 'new';
    if (counts.hasOwnProperty(status)) counts[status]++;
    else counts.new++;
  });

  console.log(`\n  Queue: ${counts.new} new | ${counts['in-progress']} in progress | ${counts.completed} completed | ${counts.archived} archived\n`);
  console.log('─'.repeat(70));

  const newItems = items.filter(i => i.status === 'new' || !i.status);
  const inProgressItems = items.filter(i => i.status === 'in-progress');
  const completedItems = items.filter(i => i.status === 'completed');

  if (newItems.length > 0) {
    console.log('\n  🆕 NEW (ready to claim):\n');
    newItems.forEach(item => {
      const title = (item.title || 'No title').substring(0, 50);
      const priority = item.priority ? `[${item.priority.toUpperCase()}]` : '';
      console.log(`     ${item.id.substring(0, 8)}... ${priority} ${title}`);
    });
  }

  if (inProgressItems.length > 0) {
    console.log('\n  🔄 IN PROGRESS:\n');
    inProgressItems.forEach(item => {
      const title = (item.title || 'No title').substring(0, 50);
      const isStale = item.claimedAt?.toDate?.() &&
        (Date.now() - item.claimedAt.toDate().getTime()) > STALE_CLAIM_MS;
      console.log(`     ${item.id.substring(0, 8)}... ${title}${isStale ? ' ⚠️ STALE' : ''}`);
    });
  }

  if (completedItems.length > 0) {
    console.log('\n  ✅ COMPLETED (ready to release):\n');
    completedItems.forEach(item => {
      const title = (item.title || 'No title').substring(0, 50);
      console.log(`     ${item.id.substring(0, 8)}... ${title}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Claim the next available feedback item
 */
async function claimNextFeedback() {
  // Check for stale in-progress items first
  let itemToClaim = null;
  let isReclaim = false;

  const staleSnapshot = await db.collection(COLLECTION)
    .where('status', '==', 'in-progress')
    .get();

  for (const doc of staleSnapshot.docs) {
    const data = doc.data();
    if (data.claimedAt?.toDate?.()) {
      const claimAge = Date.now() - data.claimedAt.toDate().getTime();
      if (claimAge > STALE_CLAIM_MS) {
        itemToClaim = { id: doc.id, ...data };
        isReclaim = true;
        break;
      }
    }
  }

  // If no stale items, get highest priority "new" item
  if (!itemToClaim) {
    const newSnapshot = await db.collection(COLLECTION)
      .where('status', '==', 'new')
      .get();

    if (!newSnapshot.empty) {
      let items = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort by priority (high > medium > low), then oldest first
      const priorityOrder = { high: 1, medium: 2, low: 3, '': 4 };
      items.sort((a, b) => {
        const pA = priorityOrder[a.priority || ''] ?? 4;
        const pB = priorityOrder[b.priority || ''] ?? 4;
        if (pA !== pB) return pA - pB;
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeA - timeB;
      });

      if (items.length > 0) itemToClaim = items[0];
    }
  }

  if (!itemToClaim) {
    console.log('\n' + '='.repeat(70));
    console.log('\n  ✨ QUEUE EMPTY - No unclaimed feedback!\n');
    console.log('  Run `node fetch-feedback.js list` to see all items.');
    console.log('\n' + '='.repeat(70) + '\n');
    return null;
  }

  // Claim it
  await db.collection(COLLECTION).doc(itemToClaim.id).update({
    status: 'in-progress',
    claimedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const createdAt = itemToClaim.createdAt?.toDate?.()?.toLocaleString() || 'Unknown';

  console.log('\n' + '='.repeat(70));
  console.log(`\n  ${isReclaim ? '🔄 RECLAIMED' : '🎯 CLAIMED'} FEEDBACK\n`);
  console.log('─'.repeat(70));
  console.log(`  ID: ${itemToClaim.id}`);
  console.log(`  Type: ${itemToClaim.type || 'N/A'}`);
  console.log(`  Priority: ${itemToClaim.priority || 'N/A'}`);
  console.log(`  Created: ${createdAt}`);
  console.log('─'.repeat(70));
  console.log(`  Title: ${itemToClaim.title || 'No title'}`);
  console.log('─'.repeat(70));
  console.log(`  Description:\n`);
  console.log(`  ${itemToClaim.description || 'No description'}`);
  if (itemToClaim.adminNotes) {
    console.log('─'.repeat(70));
    console.log(`  Previous Notes: ${itemToClaim.adminNotes}`);
  }
  console.log('\n' + '='.repeat(70));
  console.log(`\n  To complete: node fetch-feedback.js ${itemToClaim.id} completed "Your notes"\n`);

  return itemToClaim;
}

/**
 * View specific feedback item
 */
async function viewFeedback(docId) {
  const doc = await db.collection(COLLECTION).doc(docId).get();

  if (!doc.exists) {
    console.log(`\n  ❌ Feedback not found: ${docId}\n`);
    return null;
  }

  const item = { id: doc.id, ...doc.data() };
  const createdAt = item.createdAt?.toDate?.()?.toLocaleString() || 'Unknown';

  console.log('\n' + '='.repeat(70));
  console.log('\n  📋 FEEDBACK DETAILS\n');
  console.log('─'.repeat(70));
  console.log(`  ID: ${item.id}`);
  console.log(`  Status: ${item.status || 'new'}`);
  console.log(`  Type: ${item.type || 'N/A'}`);
  console.log(`  Priority: ${item.priority || 'N/A'}`);
  console.log(`  Created: ${createdAt}`);
  console.log('─'.repeat(70));
  console.log(`  Title: ${item.title || 'No title'}`);
  console.log('─'.repeat(70));
  console.log(`  Description:\n`);
  console.log(`  ${item.description || 'No description'}`);
  if (item.adminNotes) {
    console.log('─'.repeat(70));
    console.log(`  Admin Notes: ${item.adminNotes}`);
  }
  console.log('\n' + '='.repeat(70) + '\n');

  return item;
}

/**
 * Update feedback status
 */
async function updateFeedback(docId, status, notes) {
  const validStatuses = ['new', 'in-progress', 'completed', 'archived'];

  // Normalize status
  const statusMap = {
    'in_progress': 'in-progress',
    'inprogress': 'in-progress'
  };
  const normalizedStatus = statusMap[status] || status;

  if (!validStatuses.includes(normalizedStatus)) {
    console.log(`\n  ⚠️ Invalid status "${status}". Valid: ${validStatuses.join(', ')}\n`);
    return null;
  }

  const docRef = db.collection(COLLECTION).doc(docId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log(`\n  ❌ Feedback not found: ${docId}\n`);
    return null;
  }

  const updateData = {
    status: normalizedStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (notes) {
    updateData.adminNotes = notes;
  }

  if (['completed', 'archived'].includes(normalizedStatus)) {
    updateData.claimedAt = admin.firestore.FieldValue.delete();
  }

  await docRef.update(updateData);

  const item = doc.data();
  console.log('\n' + '='.repeat(70));
  console.log('\n  ✅ FEEDBACK UPDATED\n');
  console.log('─'.repeat(70));
  console.log(`  ID: ${docId}`);
  console.log(`  Title: ${item.title || 'No title'}`);
  console.log(`  New Status: ${normalizedStatus}`);
  if (notes) console.log(`  Notes: ${notes}`);
  console.log('\n' + '='.repeat(70) + '\n');

  return { id: docId, status: normalizedStatus };
}

/**
 * Update priority
 */
async function updatePriority(docId, priority) {
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    console.log(`\n  ⚠️ Invalid priority "${priority}". Valid: ${validPriorities.join(', ')}\n`);
    return null;
  }

  const docRef = db.collection(COLLECTION).doc(docId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log(`\n  ❌ Feedback not found: ${docId}\n`);
    return null;
  }

  await docRef.update({
    priority,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n  ✅ Priority updated to: ${priority.toUpperCase()}\n`);
  console.log('='.repeat(70) + '\n');

  return { id: docId, priority };
}

/**
 * Delete feedback
 */
async function deleteFeedback(docId) {
  const docRef = db.collection(COLLECTION).doc(docId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log(`\n  ❌ Feedback not found: ${docId}\n`);
    return null;
  }

  await docRef.delete();

  console.log('\n' + '='.repeat(70));
  console.log(`\n  🗑️ Feedback deleted: ${docId}\n`);
  console.log('='.repeat(70) + '\n');

  return { id: docId, deleted: true };
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length === 0) {
      // Claim next item
      await claimNextFeedback();
    } else if (args[0] === 'list') {
      await listAllFeedback();
    } else if (args[0] === 'delete' && args[1]) {
      await deleteFeedback(args[1]);
    } else if (args[1] === 'priority' && args[2]) {
      await updatePriority(args[0], args[2]);
    } else if (args[1] && ['new', 'in-progress', 'completed', 'archived'].includes(args[1])) {
      await updateFeedback(args[0], args[1], args[2]);
    } else if (args.length === 1) {
      await viewFeedback(args[0]);
    } else {
      console.log('\n  Unknown command. Run without args to claim next item.\n');
    }
  } catch (error) {
    console.error('\n  Error:', error.message, '\n');
  }

  process.exit(0);
}

main();

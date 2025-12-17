/**
 * FlowTrails Submit Feedback Script
 *
 * Usage:
 *   node scripts/submit-feedback.js <title> <description> [options]
 *
 * Options:
 *   --type <bug|feature|enhancement>    Feedback type (default: feature)
 *   --priority <low|medium|high>        Priority level (default: medium)
 *   --user <austen|email>               User profile (default: austen)
 *
 * Examples:
 *   node scripts/submit-feedback.js "Fix render bug" "WebGL crashes on resize"
 *   node scripts/submit-feedback.js "Add color picker" "Trail color customization" --type feature --priority high
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const SERVICE_ACCOUNT_PATH = 'serviceAccountKey.json';
const COLLECTION = 'flowtrails-feedback';

// Known user profiles
const USER_PROFILES = {
  austen: {
    userId: 'austen-cloud',
    userEmail: 'austencloud@gmail.com',
    userDisplayName: 'Austen Cloud'
  },
  claude: {
    userId: 'system',
    userEmail: 'claude@flowtrails.app',
    userDisplayName: 'Claude Agent'
  }
};

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.error('');
    console.error('Usage:');
    console.error('  node scripts/submit-feedback.js <title> <description> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --type <bug|feature|enhancement>    Feedback type (default: feature)');
    console.error('  --priority <low|medium|high>        Priority level (default: medium)');
    console.error('  --user <austen|claude|email>        User profile (default: austen)');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/submit-feedback.js "Fix bug" "Description here"');
    console.error('  node scripts/submit-feedback.js "New feature" "Details" --type feature --priority high');
    process.exit(1);
  }

  const title = args[0];
  const description = args[1];

  const options = {
    type: 'feature',
    priority: 'medium',
    user: 'austen'
  };

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    } else if (args[i] === '--priority' && args[i + 1]) {
      options.priority = args[i + 1];
      i++;
    } else if (args[i] === '--user' && args[i + 1]) {
      options.user = args[i + 1].toLowerCase();
      i++;
    }
  }

  // Validate type
  const validTypes = ['bug', 'feature', 'enhancement'];
  if (!validTypes.includes(options.type)) {
    console.error(`❌ Invalid type "${options.type}". Must be: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(options.priority)) {
    console.error(`❌ Invalid priority "${options.priority}". Must be: ${validPriorities.join(', ')}`);
    process.exit(1);
  }

  return { title, description, ...options };
}

async function submitFeedback(params) {
  // Check for service account
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Missing serviceAccountKey.json');
    console.error('Place your Firebase service account key at the project root.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();

  // Resolve user profile
  let userProfile;
  if (USER_PROFILES[params.user]) {
    userProfile = USER_PROFILES[params.user];
  } else if (params.user.includes('@')) {
    userProfile = {
      userId: params.user.split('@')[0],
      userEmail: params.user,
      userDisplayName: params.user.split('@')[0]
    };
  } else {
    console.error(`❌ Unknown user "${params.user}". Use: austen, claude, or an email.`);
    process.exit(1);
  }

  const feedbackData = {
    userId: userProfile.userId,
    userEmail: userProfile.userEmail,
    userDisplayName: userProfile.userDisplayName,

    type: params.type,
    title: params.title,
    description: params.description,
    priority: params.priority,

    status: 'new',
    adminNotes: 'Submitted via CLI',

    createdAt: Timestamp.now(),
    updatedAt: null
  };

  const docRef = await db.collection(COLLECTION).add(feedbackData);

  console.log('');
  console.log('✅ Feedback submitted!');
  console.log('');
  console.log(`   📋 ID: ${docRef.id}`);
  console.log(`   📝 Title: ${params.title}`);
  console.log(`   🏷️  Type: ${params.type}`);
  console.log(`   ⚡ Priority: ${params.priority}`);
  console.log(`   👤 User: ${userProfile.userDisplayName}`);
  console.log('');
  console.log(`   Run \`node fetch-feedback.js\` to claim it.`);
  console.log('');

  process.exit(0);
}

const params = parseArgs();
submitFeedback(params);

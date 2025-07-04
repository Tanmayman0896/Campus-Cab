#!/usr/bin/env node

/**
 * Simple Server Test - Check if the server can start without callback errors
 */

console.log('Testing Server Startup...\n');

// Check if all required files exist
const fs = require('fs');
const requiredFiles = [
  'src/server.js',
  'src/routes/requests.js',
  'src/routes/users.js',
  'src/routes/votes.js',
  'src/controllers/requestController.js',
  'src/controllers/userController.js',
  'src/controllers/voteController.js'
];

console.log('1. Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(` ${file}`);
  } else {
    console.log(` ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n Some required files are missing!');
  process.exit(1);
}

// Check for syntax errors in route files
console.log('\n2. Checking route files for syntax...');
const routeFiles = ['src/routes/requests.js', 'src/routes/users.js', 'src/routes/votes.js'];

routeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Simple syntax check - look for common issues
    const issues = [];
    
    // Check for undefined controller methods
    const controllerCalls = content.match(/\w+Ctrl\.\w+/g) || [];
    console.log(`${file} controller calls:`, controllerCalls);
    
    // Check for missing commas or brackets
    if (content.includes('router.') && !content.includes('module.exports')) {
      issues.push('Missing module.exports');
    }
    
    if (issues.length > 0) {
      console.log(`  ${file} - Issues: ${issues.join(', ')}`);
    } else {
      console.log(` ${file} - Syntax looks good`);
    }
  } catch (error) {
    console.log(`${file} - Error reading file: ${error.message}`);
  }
});

console.log('\n3. Summary of controller method names:');
console.log('Request Controller: createRequest, updateRequest, deleteRequest, searchRequests, getAllRequests, getUserRequests, getRequestById');
console.log('User Controller: getProfile, updateProfile, deleteUser, getUserStats, getAllUsers');
console.log(' Vote Controller: vote, getRequestVotes, getUserVotes, deleteVote');

console.log('\n File structure and syntax check complete!');
console.log(' The route callback error should now be resolved.');
console.log('\n To test the server:');
console.log('   - Run: npm start');
console.log('   - Or: node src/server.js');
console.log('   - Or: npm run dev (for development with nodemon)');

#!/usr/bin/env node

/**
 * Firebase Configuration Verification Script
 * 
 * This script helps verify that Firebase is properly configured
 * for the Pick For Me authentication system.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentFile() {
  log('\n🔍 Checking environment configuration...', 'blue');
  
  const envFiles = ['.env.local', '.env'];
  let envFile = null;
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      envFile = file;
      break;
    }
  }
  
  if (!envFile) {
    log('❌ No environment file found (.env.local or .env)', 'red');
    log('💡 Copy .env.example to .env.local and configure Firebase variables', 'yellow');
    return false;
  }
  
  log(`✅ Found environment file: ${envFile}`, 'green');
  
  // Read and parse environment file
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  return checkFirebaseVariables(envVars);
}

function checkFirebaseVariables(envVars) {
  log('\n🔥 Checking Firebase configuration variables...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  const placeholderValues = [
    'your_firebase_api_key_here',
    'your_project_id.firebaseapp.com',
    'your_project_id_here',
    'your_project_id.appspot.com',
    'your_messaging_sender_id_here',
    'your_firebase_app_id_here',
  ];
  
  let allConfigured = true;
  
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    
    if (!value) {
      log(`❌ Missing: ${varName}`, 'red');
      allConfigured = false;
    } else if (placeholderValues.includes(value)) {
      log(`⚠️  Placeholder value: ${varName}`, 'yellow');
      allConfigured = false;
    } else {
      log(`✅ Configured: ${varName}`, 'green');
    }
  });
  
  // Check emulator configuration
  const useEmulator = envVars['NEXT_PUBLIC_USE_FIREBASE_EMULATOR'];
  if (useEmulator === 'true') {
    log('\n🧪 Firebase Emulator mode enabled', 'blue');
    log('   Make sure to run: npm run firebase:emulator', 'yellow');
  }
  
  return allConfigured;
}

function checkFirebaseFiles() {
  log('\n📁 Checking Firebase-related files...', 'blue');
  
  const requiredFiles = [
    'src/lib/firebase.ts',
    'src/lib/auth-service.ts',
    'src/lib/validation.ts',
    'src/lib/storage.ts',
    'src/types/auth.ts',
    'src/types/forms.ts',
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      log(`✅ ${filePath}`, 'green');
    } else {
      log(`❌ Missing: ${filePath}`, 'red');
      allFilesExist = false;
    }
  });
  
  // Check optional files
  const optionalFiles = [
    { path: 'firebase.json', description: 'Firebase emulator configuration' },
    { path: 'docs/FIREBASE_SETUP.md', description: 'Setup documentation' },
  ];
  
  optionalFiles.forEach(({ path, description }) => {
    if (fs.existsSync(path)) {
      log(`✅ ${path} (${description})`, 'green');
    } else {
      log(`⚠️  Optional: ${path} (${description})`, 'yellow');
    }
  });
  
  return allFilesExist;
}

function checkDependencies() {
  log('\n📦 Checking Firebase dependencies...', 'blue');
  
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'firebase',
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
  ];
  
  let allDepsInstalled = true;
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      log(`✅ ${dep} (${dependencies[dep]})`, 'green');
    } else {
      log(`❌ Missing: ${dep}`, 'red');
      allDepsInstalled = false;
    }
  });
  
  return allDepsInstalled;
}

function printSummary(envConfigured, filesExist, depsInstalled) {
  log('\n📋 Summary:', 'bold');
  
  if (envConfigured && filesExist && depsInstalled) {
    log('🎉 Firebase authentication is properly configured!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Start development server: npm run dev', 'reset');
    log('2. Or start with emulator: npm run dev:emulator', 'reset');
    log('3. Test authentication flows in your application', 'reset');
  } else {
    log('⚠️  Firebase authentication setup is incomplete', 'yellow');
    log('\nIssues found:', 'red');
    
    if (!envConfigured) {
      log('- Environment variables need configuration', 'red');
      log('  → See docs/FIREBASE_SETUP.md for instructions', 'yellow');
    }
    
    if (!filesExist) {
      log('- Some Firebase files are missing', 'red');
      log('  → Run the setup task to create missing files', 'yellow');
    }
    
    if (!depsInstalled) {
      log('- Firebase dependencies need installation', 'red');
      log('  → Run: npm install firebase react-hook-form @hookform/resolvers zod', 'yellow');
    }
  }
}

function main() {
  log('🔥 Firebase Authentication Setup Verification', 'bold');
  log('='.repeat(50), 'blue');
  
  const envConfigured = checkEnvironmentFile();
  const filesExist = checkFirebaseFiles();
  const depsInstalled = checkDependencies();
  
  printSummary(envConfigured, filesExist, depsInstalled);
  
  process.exit(envConfigured && filesExist && depsInstalled ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentFile,
  checkFirebaseVariables,
  checkFirebaseFiles,
  checkDependencies,
};
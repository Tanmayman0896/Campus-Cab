
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up your Rideshare Backend...\n');

// First, let's check if you have a compatible Node.js version
const currentVersion = process.version;
const minRequired = 'v18.0.0';

if (currentVersion < minRequired) {
  console.error(`Oops! You need Node.js ${minRequired} or higher.`);
  console.error(`   Currently running: ${currentVersion}`);
  console.error(`   Please update Node.js and try again.`);
  process.exit(1);
}

console.log(`Node.js version ${currentVersion} looks good!`);

try {
  // Check if we need to create an environment file
  const envFilePath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envFilePath)) {
    console.log('Creating your .env file from template...');
    const templatePath = path.join(__dirname, '..', '.env.example');
    
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, envFilePath);
      console.log('.env file created! Don\'t forget to fill in your secrets.\n');
    } else {
      console.log('No .env.example found, you\'ll need to create .env manually.\n');
    }
  } else {
    console.log('.env file already exists.\n');
  }

  // Install all the packages we need
  console.log('Installing project dependencies...');
  console.log('   (This might take a minute or two)');
  execSync('npm install', { stdio: 'inherit' });
  console.log('All dependencies installed successfully!\n');

  // Generate Prisma client for database operations
  console.log('Setting up database client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Database client ready to go!\n');

  console.log('Setup completed successfully!\n');
  console.log('Here\'s what you need to do next:');
  console.log('1. Fill in your .env file with your database and Firebase credentials');
  console.log('2. Set up your PostgreSQL database');
  console.log('3. Configure your Firebase project');
  console.log('4. Run "npm run prisma:migrate" to create your database tables');
  console.log('5. Start developing with "npm run dev"\n');

  console.log('Need help? Check out the README.md file for detailed instructions!');

} catch (error) {
  console.error('Something went wrong during setup:', error.message);
  console.error('\nTry running the setup again, or check if all prerequisites are installed.');
  process.exit(1);
}

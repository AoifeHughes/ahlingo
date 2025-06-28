#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📱 Adding database file to iOS Xcode project...');

const projectPath = path.join(__dirname, '../ios/mobile.xcodeproj/project.pbxproj');

// Generate unique IDs (24 characters, similar to Xcode's format)
function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase() + 
         Math.random().toString(36).substr(2, 9).toUpperCase() + 
         Math.random().toString(36).substr(2, 6).toUpperCase();
}

const dbFileRefId = generateId();
const dbBuildFileId = generateId();

try {
  let projectContent = fs.readFileSync(projectPath, 'utf8');

  // Check if database is already in the project
  if (projectContent.includes('languageLearningDatabase.db')) {
    console.log('✅ Database file already exists in Xcode project');
    return;
  }

  // 1. Add PBXBuildFile entry (after line 14)
  const buildFileSection = '/* End PBXBuildFile section */';
  const newBuildFile = `\t\t${dbBuildFileId} /* languageLearningDatabase.db in Resources */ = {isa = PBXBuildFile; fileRef = ${dbFileRefId} /* languageLearningDatabase.db */; };\n/* End PBXBuildFile section */`;
  projectContent = projectContent.replace(buildFileSection, newBuildFile);

  // 2. Add PBXFileReference entry (after line 26)
  const fileRefSection = '\t\tED297162215061F000B7C4FE /* JavaScriptCore.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = JavaScriptCore.framework; path = System/Library/Frameworks/JavaScriptCore.framework; sourceTree = SDKROOT; };';
  const newFileRef = `\t\t${dbFileRefId} /* languageLearningDatabase.db */ = {isa = PBXFileReference; lastKnownFileType = file; name = languageLearningDatabase.db; path = mobile/languageLearningDatabase.db; sourceTree = "<group>"; };\n\t\t${fileRefSection}`;
  projectContent = projectContent.replace(fileRefSection, newFileRef);

  // 3. Add to mobile group (after PrivacyInfo.xcprivacy line)
  const groupSection = '\t\t\t\t13B07FB81A68108700A75B9A /* PrivacyInfo.xcprivacy */,';
  const newGroupEntry = `${groupSection}\n\t\t\t\t${dbFileRefId} /* languageLearningDatabase.db */,`;
  projectContent = projectContent.replace(groupSection, newGroupEntry);

  // 4. Add to Resources build phase (after PrivacyInfo.xcprivacy in Resources)
  const resourcesSection = '\t\t\t\t59D26E1936A4540AFCD1D6FD /* PrivacyInfo.xcprivacy in Resources */,';
  const newResourceEntry = `${resourcesSection}\n\t\t\t\t${dbBuildFileId} /* languageLearningDatabase.db in Resources */,`;
  projectContent = projectContent.replace(resourcesSection, newResourceEntry);

  // Write the modified project file
  fs.writeFileSync(projectPath, projectContent);

  console.log('✅ Database file added to iOS Xcode project successfully!');
  console.log(`   - File Reference ID: ${dbFileRefId}`);
  console.log(`   - Build File ID: ${dbBuildFileId}`);
  console.log('📱 The database will now be bundled with the iOS app');

} catch (error) {
  console.error('❌ Failed to add database to Xcode project:', error.message);
  process.exit(1);
}
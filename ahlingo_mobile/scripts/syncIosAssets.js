const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(projectRoot, 'assets', 'databases');
const iosManifestPath = path.join(projectRoot, 'ios', 'link-assets-manifest.json');
const pbxprojPath = path.join(projectRoot, 'ios', 'AhLingo.xcodeproj', 'project.pbxproj');

const dbFiles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((file) => file.endsWith('.db'))
  : [];

if (dbFiles.length === 0) {
  console.log('No .db assets found to sync.');
  process.exit(0);
}

const sha1 = (filePath) =>
  crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');

const updateManifest = () => {
  let manifest = { migIndex: 1, data: [] };
  if (fs.existsSync(iosManifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(iosManifestPath, 'utf8'));
    } catch (error) {
      console.warn('Could not parse link-assets-manifest.json, rewriting:', error);
    }
  }

  const data = Array.isArray(manifest.data) ? manifest.data : [];
  const entries = new Map(data.map((item) => [item.path, item]));

  for (const file of dbFiles) {
    const relativePath = path.posix.join('assets', 'databases', file);
    const hash = sha1(path.join(assetsDir, file));
    entries.set(relativePath, { path: relativePath, sha1: hash });
  }

  manifest.data = Array.from(entries.values()).sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  fs.writeFileSync(iosManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makeId = () => crypto.randomBytes(12).toString('hex').toUpperCase();

const insertIntoSection = (text, sectionName, line) => {
  const begin = `/* Begin ${sectionName} section */`;
  const end = `/* End ${sectionName} section */`;
  const beginIndex = text.indexOf(begin);
  const endIndex = text.indexOf(end);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(`Could not find ${sectionName} section in pbxproj.`);
  }

  return text.slice(0, endIndex) + line + text.slice(endIndex);
};

const updateResourcesGroup = (text, fileRefId, file) => {
  const groupSectionStart = text.indexOf('/* Begin PBXGroup section */');
  const groupSectionEnd = text.indexOf('/* End PBXGroup section */');
  if (groupSectionStart === -1 || groupSectionEnd === -1) {
    throw new Error('Could not find PBXGroup section in pbxproj.');
  }

  const groupSection = text.slice(groupSectionStart, groupSectionEnd);
  const resourcesGroupRegex =
    /\/\* Resources \*\/ = \{\n[\s\S]*?isa = PBXGroup;[\s\S]*?\n\t\t\};/;
  const match = groupSection.match(resourcesGroupRegex);
  if (!match) {
    throw new Error('Could not find Resources group in pbxproj.');
  }

  const groupBlock = match[0];
  if (groupBlock.includes(`${fileRefId} /* ${file} */`)) {
    return text;
  }

  const childrenMarker = 'children = (\n';
  const childrenIndex = groupBlock.indexOf(childrenMarker);
  if (childrenIndex === -1) {
    throw new Error('Could not find children list in Resources group.');
  }

  const insertLine = `\t\t\t\t${fileRefId} /* ${file} */,\n`;
  const insertPos = childrenIndex + childrenMarker.length;
  const updatedGroupBlock =
    groupBlock.slice(0, insertPos) + insertLine + groupBlock.slice(insertPos);

  return text.replace(groupBlock, updatedGroupBlock);
};

const updateResourcesBuildPhase = (text, buildFileId, file) => {
  const sectionStart = text.indexOf('/* Begin PBXResourcesBuildPhase section */');
  const sectionEnd = text.indexOf('/* End PBXResourcesBuildPhase section */');
  if (sectionStart === -1 || sectionEnd === -1) {
    throw new Error('Could not find PBXResourcesBuildPhase section in pbxproj.');
  }

  const section = text.slice(sectionStart, sectionEnd);
  const resourcesPhaseRegex =
    /\/\* Resources \*\/ = \{\n[\s\S]*?isa = PBXResourcesBuildPhase;[\s\S]*?\n\t\t\};/;
  const match = section.match(resourcesPhaseRegex);
  if (!match) {
    throw new Error('Could not find Resources build phase in pbxproj.');
  }

  const phaseBlock = match[0];
  if (phaseBlock.includes(`${buildFileId} /* ${file} in Resources */`)) {
    return text;
  }

  const filesMarker = 'files = (\n';
  const filesIndex = phaseBlock.indexOf(filesMarker);
  if (filesIndex === -1) {
    throw new Error('Could not find files list in Resources build phase.');
  }

  const insertLine = `\t\t\t\t${buildFileId} /* ${file} in Resources */,\n`;
  const insertPos = filesIndex + filesMarker.length;
  const updatedPhaseBlock =
    phaseBlock.slice(0, insertPos) + insertLine + phaseBlock.slice(insertPos);

  return text.replace(phaseBlock, updatedPhaseBlock);
};

const updatePbxproj = () => {
  if (!fs.existsSync(pbxprojPath)) {
    console.log('PBXProj not found, skipping iOS project update.');
    return;
  }

  let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

  for (const file of dbFiles) {
    const fileEscaped = escapeRegExp(file);
    const fileRefRegex = new RegExp(
      `([A-F0-9]{24}) /\\* ${fileEscaped} \\*/ = \\{isa = PBXFileReference;[\\s\\S]*?path = \\.\\./assets/databases/${fileEscaped};`,
      'm'
    );
    const fileRefMatch = pbxproj.match(fileRefRegex);
    const fileRefId = fileRefMatch ? fileRefMatch[1] : makeId();

    if (!fileRefMatch) {
      const fileRefLine = `\t\t${fileRefId} /* ${file} */ = {isa = PBXFileReference; explicitFileType = undefined; fileEncoding = 9; includeInIndex = 0; lastKnownFileType = unknown; name = ${file}; path = ../assets/databases/${file}; sourceTree = \"<group>\"; };\n`;
      pbxproj = insertIntoSection(pbxproj, 'PBXFileReference', fileRefLine);
    }

    const buildFileRegex = new RegExp(
      `([A-F0-9]{24}) /\\* ${fileEscaped} in Resources \\*/ = \\{isa = PBXBuildFile;`,
      'm'
    );
    const buildFileMatch = pbxproj.match(buildFileRegex);
    const buildFileId = buildFileMatch ? buildFileMatch[1] : makeId();

    if (!buildFileMatch) {
      const buildFileLine = `\t\t${buildFileId} /* ${file} in Resources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* ${file} */; };\n`;
      pbxproj = insertIntoSection(pbxproj, 'PBXBuildFile', buildFileLine);
    }

    pbxproj = updateResourcesGroup(pbxproj, fileRefId, file);
    pbxproj = updateResourcesBuildPhase(pbxproj, buildFileId, file);
  }

  fs.writeFileSync(pbxprojPath, pbxproj);
};

updateManifest();
updatePbxproj();

console.log('iOS assets sync complete.');

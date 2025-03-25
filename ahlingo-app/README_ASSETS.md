# Language Content Assets in AHLingo App

This document explains how language content assets are handled in the AHLingo app.

## Asset Structure

The language content assets are stored in the `assets/language_learning_content` directory. The structure is as follows:

```
assets/language_learning_content/
├── index.json                 # Index file containing metadata about all language content
├── README.md                  # Documentation about the language content
├── French/                    # Language directory
│   ├── Beginner/              # Difficulty level
│   │   ├── pairs/             # Exercise type
│   │   │   ├── Greetings/     # Topic
│   │   │   │   ├── 789/       # Exercise ID
│   │   │   │   │   ├── lesson.json  # Exercise content
│   │   │   │   │   └── audio/  # Audio files for the exercise
│   │   │   │   │       ├── eng_*.wav
│   │   │   │   │       └── target_*.wav
│   │   ├── translations/
│   │   └── conversations/
│   ├── Intermediate/
│   └── Advanced/
├── Spanish/
├── German/
└── Ukrainian/
```

## Asset Loading

The app uses several approaches to load the language content assets:

1. **Document Directory with Assets Path**: The app first tries to use the document directory with the assets path.
2. **Document Directory**: If the first approach fails, the app tries to use the document directory.
3. **Alternative Asset Directory**: If the document directory approach fails, the app tries an alternative path.
4. **Cache Directory**: If all else fails, the app tries to use the cache directory.
5. **Asset Copying**: As a last resort, the app tries to copy assets from the bundle to the filesystem.

Instead of relying on bundled assets, the app now creates the necessary directory structure and files on demand. This approach is more reliable and avoids issues with the asset registry.

## Scripts

Several scripts have been added to help with asset management:

- `npm run preload-assets`: Creates the necessary directory structure and files for language content in a temporary directory.
- `npm run test-assets`: Tests the loading of language content assets to verify they are properly accessible.
- `npm run start-with-assets`: Preloads the assets and then starts the app.

## Configuration

The app.json file has been configured to include all language content assets in the asset bundle:

```json
"assetBundlePatterns": [
  "**/*",
  "assets/language_learning_content/**/*"
],
"packagerOpts": {
  "assetExts": [
    "json",
    "wav",
    "mp3"
  ]
}
```

## Troubleshooting

If you encounter issues with asset loading, try the following:

1. Run `npm run test-assets` to verify that the assets are properly accessible.
2. Run `npm run preload-assets` to create the necessary directory structure and files.
3. Run `npm run start-with-assets` to preload the assets and start the app in one command.
4. Check the console logs for any error messages related to asset loading.
5. Verify that the directory structure created by the preload-assets script matches the expected structure.
6. Ensure that the index.json file is created and properly formatted.
7. If you're still having issues, try deleting the temp_assets directory and running `npm run preload-assets` again.

## Implementation Details

The asset loading logic is implemented in the `LanguageContentService.ts` file. The service tries multiple approaches to find and load the assets, and falls back to sample data if all approaches fail.

The app's entry point (`_layout.tsx`) has been modified to create the necessary directory structure and files when the app starts. It also starts a background process to ensure that all required assets are available.

Instead of trying to load assets from the bundle, which was causing issues with the asset registry, the app now creates the necessary files on demand. This approach is more reliable and avoids issues with the asset registry.

## Future Improvements

- Add a progress indicator for asset loading
- Implement a more robust asset caching mechanism
- Add support for downloading assets from a remote server
- Implement a way to update assets without requiring a new app release

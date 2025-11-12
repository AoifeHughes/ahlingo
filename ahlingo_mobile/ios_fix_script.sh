cd ios
pod deintegrate
rm -rf AhLingo.xcworkspace
pod deintegrate
pod cache clean --all
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf Pods Podfile.lock build
pod install
cd ..

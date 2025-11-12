import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface DownloadProgressBarProps {
  progress: number;
  bytesWritten: number;
  contentLength: number;
  theme: any;
}

const formatFileSize = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
};

const DownloadProgressBar: React.FC<DownloadProgressBarProps> = React.memo(({
  progress,
  bytesWritten,
  contentLength,
  theme
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const styles = StyleSheet.create({
    progressContainer: {
      marginTop: theme.spacing.sm,
    },
    progressText: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      fontWeight: theme.typography.fontWeights.medium,
    },
    progressDetails: {
      fontSize: theme.typography.fontSizes.xs,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
  });

  const detailText =
    bytesWritten > 0 && contentLength > 0
      ? ` (${formatFileSize(bytesWritten)} / ${formatFileSize(contentLength)})`
      : '';

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Downloading: {Math.round(progress * 100)}%{detailText}
      </Text>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              })
            }
          ]}
        />
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if progress or other essential props change
  return (
    prevProps.progress === nextProps.progress &&
    prevProps.bytesWritten === nextProps.bytesWritten &&
    prevProps.contentLength === nextProps.contentLength
  );
});

DownloadProgressBar.displayName = 'DownloadProgressBar';

export default DownloadProgressBar;

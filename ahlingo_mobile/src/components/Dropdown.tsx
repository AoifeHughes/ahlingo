import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  style,
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const styles = createStyles(theme);

  const selectedItem = items.find(item => item.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const handleItemPress = (value: string) => {
    onValueChange(value);
    setIsVisible(false);
  };

  const renderItem = ({ item }: { item: DropdownItem }) => (
    <TouchableOpacity
      style={[
        styles.modalItem,
        item.value === selectedValue && styles.selectedItem,
      ]}
      onPress={() => handleItemPress(item.value)}
    >
      <Text
        style={[
          styles.modalItemText,
          item.value === selectedValue && styles.selectedItemText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdown, style]}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[styles.dropdownText, !selectedItem && styles.placeholderText]}
        >
          {displayText}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              style={styles.modalList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: currentTheme.colors.surface,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.borderRadius.base,
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: currentTheme.colors.textSecondary,
  },
  arrow: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginLeft: currentTheme.spacing.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.base,
    maxHeight: 300,
    width: '80%',
    elevation: 5,
    shadowColor: currentTheme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalList: {
    maxHeight: 250,
  },
  modalItem: {
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.borderLight,
  },
  modalItemText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
  },
  selectedItem: {
    backgroundColor: currentTheme.colors.secondary,
  },
  selectedItemText: {
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
});

export default Dropdown;
